import {IncomingHttpHeaders, IncomingMessage, ServerResponse} from "http";
import {URL} from "url";
import {OutgoingHttpHeaders} from "node:http";
import {streamToString} from "../util/util";
import {Socket} from "node:net";
import {logError} from "../util/logger";
import {minify, Options} from "html-minifier";

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

export type MyHttpRequest<Body extends DefaultIncomingBody> = {
    readonly url: URL;
    readonly method: string | undefined;
    readonly remoteAddr: string | undefined;
    readonly httpVersion: string;
    readonly socket: Socket;
    readonly cookies: Map<string, string> | undefined
    readonly headers: IncomingHttpHeaders;
    readonly body: Body;
    readonly nodeJsReqObject: IncomingMessage;
}

export type MyHttpResponse = {
    readonly status: HttpStatusCode;
    readonly headers: OutgoingHttpHeaders;
    readonly body?: string | ((res: NodeJS.WritableStream) => void);
}

export type MyRoutePathVariables = {
    name: string,
    value: string | number
}[] | undefined | null

export type DefaultIncomingBody = { [key: string]: string | number }

export type MyHttpHandler<Body extends DefaultIncomingBody = DefaultIncomingBody> =
    (req: MyHttpRequest<Body>, myPathVars: MyRoutePathVariables) => Promise<MyHttpResponse>;

const HTTP_PREFIX = 'http://';

export function getHttpStatusMessage(statusCode: HttpStatusCode): HttpStatusMessage {
    return HTTP_STATUS[statusCode];
}

export function getHttpStatusCode(statusMessage: HttpStatusMessage): HttpStatusCode {
    return Object.keys(HTTP_STATUS).map(key => parseInt(key) as HttpStatusCode).find(key => HTTP_STATUS[key] === statusMessage)!
}

export function parseRequestCookies(cookies: string): Map<string, string> {
    const allCookiesMap = new Map<string, string>();
    cookies.split(";").forEach(cookie => {
        const parts = cookie.split('=', 2);
        allCookiesMap.set(parts[0].trim(), parts[1]);
    });
    return allCookiesMap;
}

export async function reqToMyReq<Body extends DefaultIncomingBody = DefaultIncomingBody>(req: IncomingMessage): Promise<MyHttpRequest<Body>> {
    try {
        const cookies = req.headers.cookie ? parseRequestCookies(req.headers.cookie) : undefined
        const bodyString = await streamToString(req);
        const body = bodyString.trim() === '' ? null : JSON.parse(bodyString);
        return {
            url: new URL(req.url || '', `${HTTP_PREFIX}${req.headers.host}`),
            method: req.method,
            remoteAddr: req.socket.remoteAddress,
            httpVersion: req.httpVersion,
            socket: req.socket,
            headers: req.headers,
            cookies: cookies,
            body: body,
            nodeJsReqObject: req,
        };
    } catch (err) {
        logError('Error parsing request body:', err);
        throw new Error('Failed to parse request body');
    }
}

export function myResToRes(myRes: MyHttpResponse, res: ServerResponse): void {
    const {status, headers, body} = myRes;
    res.statusCode = status;
    res.statusMessage = getHttpStatusMessage(status);

    // res.setHeader('Content-Security-Policy', "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests");
    res.setHeader('Cross-Origin-Opener-Policy', "same-origin");
    res.setHeader('Cross-Origin-Resource-Policy', "cross-origin");
    res.setHeader('Origin-Agent-Cluster', "?1");
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Permissions-Policy', 'geolocation=(self "http://localhost:3000")');

    Object.entries(headers).forEach(([headerName, headerValue]) => {
        if (headerValue) res.setHeader(headerName, headerValue);
    });

    if (body) {
        if (typeof body === 'string') {
            const minifyOptions: Options = {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeEmptyAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                minifyJS: true,
                minifyCSS: true,
                removeOptionalTags: true,
                removeAttributeQuotes: true,
                quoteCharacter: "'",
                preserveLineBreaks: false,
                removeTagWhitespace: true,
                sortAttributes: true,
                sortClassName: true,
                useShortDoctype: true,
                includeAutoGeneratedTags: true
            }
            const minifiedBody = minify(body, minifyOptions)
            res.end(minifiedBody);
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