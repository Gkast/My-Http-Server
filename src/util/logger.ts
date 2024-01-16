import {IncomingMessage, ServerResponse} from "http";
import {generateTimestamp} from "./util";


export function formatHttpLogRequest(req: IncomingMessage, res: ServerResponse) {
    const {socket, method, url, httpVersion, headers} = req;
    const {remoteAddress} = socket;
    const {statusCode} = res;
    const remoteAddressFormatted = process.env.NODE_ENV === 'production' ? req.headers["x-forwarded-for"] ? '-' : remoteAddress : '-';
    const authUser = '-';
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
    const contentLength = res.getHeader('content-length') || '-';
    const referer = headers.referer || '-';
    const userAgent = headers['user-agent'] || '-';

    return `-- ${remoteAddressFormatted ? remoteAddressFormatted : '-'} ${authUser} [${timestamp}] "${method || '-'} ${url || '-'} HTTP/${httpVersion || '-'}" ${statusCode.toString() || '-'} ${contentLength.toString()} "${referer}" "${userAgent}" --`;
}

export function logHttpRequest(req: IncomingMessage, res: ServerResponse) {
    const logMessage = formatHttpLogRequest(req, res)
    logInfo('HTTP Request received:\n', logMessage);
}

export function logAll(message?: any, ...optionParams: any[]) {
    const timestamp = generateTimestamp()
    console.log(`[${timestamp}] [ANY]:`, message ? message : '', ...optionParams)
}

export function logTrace(message?: any, ...optionParams: any[]) {
    const timestamp = generateTimestamp()
    console.trace(`[${timestamp}] [TRACE]:`, message ? message : '', ...optionParams)
}

export function logDebug(message?: any, ...optionParams: any[]) {
    const timestamp = generateTimestamp()
    console.debug(`[${timestamp}] [DEBUG]:`, message ? message : '', ...optionParams)
}

export function logInfo(message?: any, ...optionParams: any[]) {
    const timestamp = generateTimestamp()
    console.info(`[${timestamp}] [INFO]:`, message ? message : '', ...optionParams)
}

export function logWarn(message?: any, ...optionParams: any[]) {
    const timestamp = generateTimestamp()
    console.warn(`[${timestamp}] [WARN]:`, message ? message : '', ...optionParams)
}

export function logError(message?: any, ...optionParams: any[]) {
    const timestamp = generateTimestamp()
    console.error(`[${timestamp}] [ERROR]:`, message ? message : '', ...optionParams)
}

export function logFatal(message?: any, ...optionParams: any[]) {
    const timestamp = generateTimestamp()
    console.error(`[${timestamp}] [FATAL]:`, message ? message : '', ...optionParams)
}