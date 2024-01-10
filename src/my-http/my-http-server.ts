import {createServer, IncomingMessage, Server, ServerResponse} from "http";
import {myResToRes, reqToMyReq} from "../util/tools";
import {getMimeType} from "./mime-types";
import {logError, logInfo} from "../util/logger";
import {MyRouter} from "./my-router";
import {Duplex} from "node:stream";

type ErrorInfo = { code: string; message: string; };
export type MyHttpServer = Server<typeof IncomingMessage, typeof ServerResponse>

export function createMyHttpServer(port: number, myRouter: MyRouter): MyHttpServer {
    logInfo('Initializing HTTP Server...')
    const myHttpServer = createServer();
    myHttpServer.on('request', (req, res) => handleRequest(req, res, myRouter));
    myHttpServer.on('error', (err: NodeJS.ErrnoException) => handleServerError(err, port));
    myHttpServer.on('clientError', (err: NodeJS.ErrnoException, socket: Duplex) => handleClientError(err, socket));
    myHttpServer.on('dropRequest', (req: IncomingMessage, socket: Duplex) => handleDropRequest(req, socket));
    myHttpServer.on('timeout', (socket: Duplex) => socket.destroy());
    return myHttpServer;
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, router: MyRouter) {
    const handleError = (err: unknown) => {
        const errorInfo: ErrorInfo = getErrorInfo(err);
        logError(`HTTP Request Handling Error:\nUrl: ${req.url}\nHeaders: ${JSON.stringify(req.headers, null, 2)}`, err);
        res.statusCode = errorInfo.code === 'Bad Request' ? 400 : 500;
        res.setHeader('Content-Type', getMimeType('json'));
        res.end(JSON.stringify({error: errorInfo.message}));
    };

    try {
        const myReq = reqToMyReq(req);
        if (!myReq || !myReq.method || !myReq.url) {
            handleError('Bad Request');
            return;
        }
        const [myHandler, myParams] = router.find(myReq.method, myReq.url.pathname.toLowerCase()) || [];
        if (!myHandler) {
            handleError('Method not found');
            return;
        }
        const myRes = await myHandler(myReq, myParams)
        myResToRes(myRes, res);
    } catch (err) {
        handleError(err);
    }
}

function handleServerError(err: NodeJS.ErrnoException, port: string | number) {
    const errorInfo: ErrorInfo = {
        code: err.code === 'EACCES' ? 'Bind requires elevated privileges' :
            err.code === 'EADDRINUSE' ? `Port ${port} is already in use` : 'Unexpected Error',
        message: err.message,
    };

    logError('HTTP Server Error:', errorInfo.message, '\n', err);
    process.exit(1);
}

function handleClientError(err: NodeJS.ErrnoException, socket: Duplex) {
    const errorMessage = err.code === 'ECONNRESET' || !socket.writable ?
        'Socket not writable or Error Code: ECONNRESET' : 'Bad Request';

    logError(`Client Error: ${errorMessage}`);

    if (!socket.writable) {
        socket.destroy();
    } else {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
}

function handleDropRequest(req: IncomingMessage, socket: Duplex) {
    logError(
        'Request Dropped:',
        'Request details:',
        req,
        'Socket details:',
        socket,
    );
    socket.end('HTTP/1.1 503 Service Unavailable\r\n\r\n');
}

function getErrorInfo(err: unknown): ErrorInfo {
    if (err instanceof SyntaxError || err instanceof TypeError) {
        return {code: 'Bad Request', message: 'Bad Request'};
    }
    return {code: 'Internal Server Error', message: 'Internal Server Error'};
}