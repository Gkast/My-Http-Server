import {HttpMethod, MyRouter} from "./router";
import * as http from "http";
import {IncomingMessage, ServerResponse} from "http";
import {getHttpStatusMessage, MyHttpHandler, MyHttpRequest, MyParams, myResToRes, reqToMyReq} from "../util/tools";
import {getMimeType} from "./mime-types";
import {logError, logInfo} from "../util/logger";
import {Duplex} from "node:stream";
import {Socket} from "node:net";

export type Middleware = (req: MyHttpRequest, res: ServerResponse, next: () => void) => void;

export class MyHTTP {
    private readonly router: MyRouter;
    private readonly server: http.Server;
    private middlewareStack: Middleware[] = [];

    constructor(port: number) {
        this.router = new MyRouter();
        this.server = http.createServer();
        this.server.on('request', this.handleRequest.bind(this));
        this.server.on('listening', this.onListening.bind(this));
        this.server.on('connection', this.onConnection.bind(this));
        this.server.on('close', this.onClose.bind(this));
        this.server.on('error', (err: NodeJS.ErrnoException) => this.handleServerError(err, port));
        this.server.on('clientError', (err: NodeJS.ErrnoException, socket: Duplex) => this.handleClientError(err, socket));
        this.server.on('dropRequest', (req: IncomingMessage, socket: Duplex) => this.handleDropRequest(req, socket));
        this.server.on('timeout', this.onTimeout.bind(this));
    }

    init(port: number, host?: string, callback?: () => void) {
        this.server.listen(port, host, callback);
    }

    useMiddleware(middleware: Middleware) {
        this.middlewareStack.push(middleware);
    }

    getRouter(): MyRouter {
        return this.router;
    }

    getServer(): http.Server {
        return this.server;
    }

    private handleServerError(err: NodeJS.ErrnoException, port: string | number) {
        let errorInfo: string;
        if (err.code === 'EACCES') {
            errorInfo = `Bind ${port} requires elevated privileges`;
        } else if (err.code === 'EADDRINUSE') {
            errorInfo = `Port ${port} is already in use`;
        } else {
            errorInfo = 'Unexpected Error';
        }
        logError('HTTP Server Error:', errorInfo, '\n', err);
        process.exit(1);
    }

    private handleClientError(err: NodeJS.ErrnoException, socket: Duplex) {
        if (err.code === 'ECONNRESET' || !socket.writable) {
            logError('Client Error: Socket not writable or Error Code: ECONNRESET');
            return;
        }
        logError('Client Error: Bad Request');
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }

    private handleDropRequest(req: IncomingMessage, socket: Duplex) {
        logError(
            'Request Dropped:',
            'Request details:',
            req,
            'Socket details:',
            socket,
        );
        socket.end(`HTTP/1.1 503 Service Unavailable\r\n\r\n`);
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        try {
            const myReq = reqToMyReq(req);
            const route = await this.router.findRoute(myReq.method as HttpMethod, myReq.url.pathname.toLowerCase());
            if (!route || !route[0]) {
                res.statusCode = 405;
                res.setHeader('Content-Type', getMimeType("pl"));
                res.end('Method not found');
                return;
            }
            const myHandler = route[0];
            const myParams = route[1];
            await this.runMiddlewares(myReq, res, myHandler, myParams);
        } catch (err) {
            logError(`HTTP Request Handling Error: 
Url: ${req.url} 
Headers: ${JSON.stringify(req.headers, null, 2)}`, err);
            req.statusCode = 500;
            req.statusMessage = getHttpStatusMessage(res.statusCode);
            res.setHeader('Content-Type', getMimeType("json"));
            res.end('Internal Server Error');
        }
    }

    private async runMiddlewares(
        myReq: MyHttpRequest,
        res: http.ServerResponse,
        myHandler: MyHttpHandler,
        myParams: MyParams
    ) {
        let index = 0;
        const next = async () => {
            if (index < this.middlewareStack.length) {
                this.middlewareStack[index++](myReq, res, next);
            } else {
                const myRes = await myHandler(myReq, myParams);
                myResToRes(myRes, res);
            }
        };
        await next();
    }

    private onListening() {
        const address = this.server.address();
        const port = typeof address === 'string' ? address : address?.port;
        if (port) {
            logInfo('Server is now listening on port: ' + port);
        }
    }

    private onClose() {
        logInfo('Server has been closed.');
    }

    private onTimeout(socket: Duplex) {
        logError('Socket timed out');
        socket.destroy();
    }

    private onConnection(socket: Socket) {
        logInfo('New connection:', socket.remoteAddress);
    }
}