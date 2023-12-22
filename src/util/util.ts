import {IncomingMessage, ServerResponse} from "http";

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