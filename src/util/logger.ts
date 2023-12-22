import {IncomingMessage, ServerResponse} from "http";
import {formatHttpLogRequest, generateTimestamp} from "./util";


export function logHttpRequest(req: IncomingMessage, res: ServerResponse) {
    const logMessage = formatHttpLogRequest(req, res)
    logInfo('HTTP Request received:\n', logMessage);
}

export function logAll(message?: any, ...optionParams: any) {
    const timestamp = generateTimestamp()
    console.log(`[${timestamp}] [ANY]:`, message ? message : '', ...optionParams)
}

export function logTrace(message?: any, ...optionParams: any) {
    const timestamp = generateTimestamp()
    console.trace(`[${timestamp}] [TRACE]:`, message ? message : '', ...optionParams)
}

export function logDebug(message?: any, ...optionParams: any) {
    const timestamp = generateTimestamp()
    console.debug(`[${timestamp}] [DEBUG]:`, message ? message : '', ...optionParams)
}

export function logInfo(message?: any, ...optionParams: any) {
    const timestamp = generateTimestamp()
    console.info(`[${timestamp}] [INFO]:`, message ? message : '', ...optionParams)
}

export function logWarn(message?: any, ...optionParams: any) {
    const timestamp = generateTimestamp()
    console.warn(`[${timestamp}] [WARN]:`, message ? message : '', ...optionParams)
}

export function logError(message?: any, ...optionParams: any) {
    const timestamp = generateTimestamp()
    console.error(`[${timestamp}] [ERROR]:`, message ? message : '', ...optionParams)
}

export function logFatal(message?: any, ...optionParams: any) {
    const timestamp = generateTimestamp()
    console.error(`[${timestamp}] [FATAL]:`, message ? message : '', ...optionParams)
}