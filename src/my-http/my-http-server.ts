import {createServer, IncomingMessage, Server, ServerResponse} from "http";
import {
    getHttpStatusCode,
    HttpStatusCode,
    HttpStatusMessage,
    MyHttpHandler,
    myResToRes,
    reqToMyReq
} from "./my-http-tools";
import {getMimeType} from "./my-mime-types";
import {logError, logInfo} from "../util/logger";
import {MyRouter} from "./my-router";
import {Duplex} from "node:stream";
import {HttpMethod} from "./trie-http-router";

type ErrorInfo = { readonly code: string; readonly message: string; };
type HttpErrorInfo = { readonly statusCode: HttpStatusCode; readonly statusMessage: HttpStatusMessage; };
export type MyHttpServer = Server<typeof IncomingMessage, typeof ServerResponse>

export function createMyHttpServer(port: number, myRouter: MyRouter<MyHttpHandler>): MyHttpServer {
    logInfo('Initializing HTTP Server...')
    const myHttpServer = createServer();
    myHttpServer.on('request', (req, res) => handleRequest(req, res, myRouter));
    myHttpServer.on('error', (err: NodeJS.ErrnoException) => handleServerError(err, port));
    myHttpServer.on('clientError', (err: NodeJS.ErrnoException, socket: Duplex) => handleClientError(err, socket));
    myHttpServer.on('dropRequest', (req: IncomingMessage, socket: Duplex) => handleDropRequest(req, socket));
    myHttpServer.on('timeout', (socket: Duplex) => socket.destroy());
    return myHttpServer;
}

function handleRequest(req: IncomingMessage, res: ServerResponse, router: MyRouter<MyHttpHandler>) {
    const handleError = (errorMessage: HttpStatusMessage, err?: unknown) => {
        const errorInfo = getHttpErrorInfo(errorMessage);
        logError(`HTTP Request Error:\nUrl: ${req.url}\nHeaders: ${JSON.stringify(req.headers, null, 2)}`, '\nHTTP Message:', errorMessage, '\nError:', !err ? 'No Error Object' : err);
        res.statusCode = errorInfo.statusCode
        res.statusMessage = errorInfo.statusMessage
        res.setHeader('Content-Type', getMimeType('pl'));
        res.end(errorInfo.statusMessage);
    };

    try {
        const myReq = reqToMyReq(req);
        if (!myReq || !myReq.method || !myReq.url) {
            handleError('Bad Request');
            return;
        }

        const isHttpMethod = (method: string): method is HttpMethod => {
            return [
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "HEAD",
                "CONNECT",
                "OPTIONS",
                "TRACE",
                "PATCH"
            ].includes(method as HttpMethod);
        }
        if (!isHttpMethod(myReq.method.toUpperCase())) {
            handleError('Method Not Allowed');
            return;
        }
        const [myHandler, myParams] = router.find(myReq.method, myReq.url.pathname.toLowerCase());
        if (!myHandler) {
            handleError('Not Found');
            return;
        }
        myHandler(myReq, myParams)
            .then(myRes => myResToRes(myRes, res))
            .catch(reason => handleError('Internal Server Error', reason))
    } catch (err) {
        handleError('Internal Server Error', err);
    }
}

function handleServerError(err: NodeJS.ErrnoException, port: number) {
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

function getHttpErrorInfo(errorMessage: HttpStatusMessage): HttpErrorInfo {
    return {statusCode: getHttpStatusCode(errorMessage), statusMessage: errorMessage}
}