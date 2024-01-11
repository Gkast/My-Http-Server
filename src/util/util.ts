import {IncomingMessage, ServerResponse} from "http";
import fs from "fs";
import {pageNotFoundResponse} from "../my-http/http-responses";
import {MyHttpHandler} from "./tools";
import {getMimeType, MimeExtensions} from "../my-http/mime-types";
import path from "node:path";
import {logError} from "./logger";

export function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => Buffer.isBuffer(chunk) ? chunks.push(chunk) : reject(new Error('Received non-buffer data')));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => chunks.length === 0 ? resolve('') : resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

export function generateTimestamp() {
    return new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
}

export function formatHttpLogRequest(req: IncomingMessage, res: ServerResponse) {
    const {socket, method, url, httpVersion, headers} = req;
    const {remoteAddress} = socket;
    const {statusCode} = res;
    const remoteAddressFormatted = process.env.NODE_ENV === 'production' ? req.headers["x-forwarded-for"] : (remoteAddress || '-');
    const authUser = '-';
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
    const contentLength = res.getHeader('content-length') || '-';
    const referer = headers.referer || '-';
    const userAgent = headers['user-agent'] || '-';

    return `-- ${remoteAddressFormatted} ${authUser} [${timestamp}] "${method || '-'} ${url || '-'} HTTP/${httpVersion || '-'}" ${statusCode || '-'} ${contentLength} "${referer}" "${userAgent}" --`;
}

export function parseRequestCookies(cookie: string) {
    const allCookiesMap = new Map<string, string>();
    if (cookie) {
        cookie.split(";").forEach(cookie => {
            const parts = cookie.split('=', 2);
            allCookiesMap.set(parts[0].trim(), parts[1]);
        });
    }
    return allCookiesMap;
}

export function staticFileReqList(): MyHttpHandler {
    return async (req) => {
        try {
            const decodedPath = decodeURIComponent(req.url.pathname);
            const requestedFilePath = path.join(__dirname, '../..', decodedPath);
            const result = await fs.promises.stat(requestedFilePath);
            const ext = decodedPath.split('.').pop();

            if (result.isFile() && ext !== undefined) {
                const forceDownload = req.url.searchParams.get('download') === '1';
                const contentType = getMimeType(ext as MimeExtensions) || getMimeType("bin");

                const fileStream = fs.createReadStream(requestedFilePath);
                fileStream.on('error', (error) => {
                    logError('Error reading file:', error);
                    return {
                        status: 500,
                        headers: {
                            "content-type": getMimeType('pl')
                        },
                        body: 'Internal Server Error'
                    };
                });

                const headers = {
                    'content-type': contentType,
                    'content-length': result.size.toString(),
                    'content-disposition': forceDownload ? 'attachment' : 'inline',
                };

                return {status: 200, headers, body: (res) => fileStream.pipe(res)};
            } else {
                return pageNotFoundResponse('File Not Found', `<h1>File Not Found</h1>`);
            }
        } catch (error) {
            logError('Error serving static file:', error);
            return {
                status: 500,
                headers: {
                    "content-type": getMimeType('pl')
                },
                body: 'Internal Server Error'
            }
        }
    };
}