import {IncomingHttpHeaders, IncomingMessage, ServerResponse} from "http";
import {URL} from "url";
import {OutgoingHttpHeaders} from "node:http";
import {streamToString} from "./util";
import {Socket} from "node:net";
import {logError} from "./logger";

const HTTP_STATUS = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    208: 'Already Reported',
    226: 'IM Used',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    306: 'unused',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a teapot',
    421: 'Misdirected Request',
    422: 'Unprocessable Content',
    423: 'Locked',
    424: 'Failed Dependency',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required',
} as const

export type HttpStatusCode = keyof typeof HTTP_STATUS;
export type HttpStatusMessage = typeof HTTP_STATUS[HttpStatusCode];

export type MyHttpRequest<Body extends { [key: string]: string } | null | undefined> = {
    readonly url: URL;
    readonly method: string | undefined;
    readonly remoteAddr: string | undefined;
    readonly httpVersion: string;
    readonly socket: Socket;
    readonly headers: IncomingHttpHeaders;
    readonly body: Body extends { [key: string]: string } | null | undefined ? Body : never;
    readonly nodeJsReqObject: IncomingMessage;
}

export type MyHttpResponse = {
    readonly status: HttpStatusCode;
    readonly headers: OutgoingHttpHeaders;
    readonly body?: string | ((res: NodeJS.WritableStream) => void);
}

export type PathVariables = {
    name: string,
    value: string | number
}[] | undefined | null

export type MyHttpHandler<Body extends { [key: string]: string } | null | undefined = {
    [key: string]: string;
} | null | undefined> = (req: MyHttpRequest<Body>, myPathVars: PathVariables) => Promise<MyHttpResponse>;

const HTTP_PREFIX = 'http://';

export function getHttpStatusMessage(statusCode: HttpStatusCode): HttpStatusMessage {
    return HTTP_STATUS[statusCode];
}

export function getHttpStatusCode(statusMessage: HttpStatusMessage): HttpStatusCode {
    const statusCode = Object.keys(HTTP_STATUS).find(key => HTTP_STATUS[parseInt(key) as HttpStatusCode] === statusMessage)
    return parseInt(statusCode!) as HttpStatusCode
}

export async function reqToMyReq(req: IncomingMessage): Promise<MyHttpRequest<{
    [key: string]: string
} | null | undefined>> {
    try {
        const bodyString = await streamToString(req);
        const body = bodyString.trim() === '' ? null : JSON.parse(bodyString);

        return {
            url: new URL(req.url || '', `${HTTP_PREFIX}${req.headers.host}`),
            method: req.method,
            remoteAddr: req.socket.remoteAddress,
            httpVersion: req.httpVersion,
            socket: req.socket,
            headers: req.headers,
            body: body,
            nodeJsReqObject: req,
        };
    } catch (error) {
        logError('Error parsing request body:', error);
        throw new Error('Failed to parse request body');
    }
}

export function myResToRes(myRes: MyHttpResponse, res: ServerResponse): void {
    const {status, headers, body} = myRes;
    res.statusCode = status;
    res.statusMessage = getHttpStatusMessage(status);

    if (headers) {
        Object.entries(headers).forEach(([headerName, headerValue]) => {
            if (headerValue) res.setHeader(headerName, headerValue);
        });
    }

    if (body) {
        if (typeof body === 'string') {
            res.end(body);
        } else if (typeof body === 'function') {
            body(res);
        } else {
            res.setHeader("Content-Type", "text/plain")
            res.statusCode = 500;
            res.statusMessage = getHttpStatusMessage(500)
            res.end('Internal Server Error');
            logError('Unexpected response body type:', typeof body);
        }
    } else {
        res.end();
    }
}