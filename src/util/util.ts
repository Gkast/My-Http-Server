import {X2jOptions, XMLParser} from "fast-xml-parser";
import {Fields, Files, IncomingForm} from 'formidable';
import {IncomingMessage} from "http";
import {logError} from "./logger";
import {parse} from "node:querystring";
import {format as dateFormatter, I18nSettings, I18nSettingsOptional, parse as dateParser} from "fecha";

export function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => Buffer.isBuffer(chunk) ? chunks.push(chunk) : reject(new Error('Received non-buffer data')));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => chunks.length === 0 ? resolve('') : resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

export async function parseXmlStream<XMLType = unknown>(stream: NodeJS.ReadableStream, options?: X2jOptions,
                                                        validationOptions?: {
                                                            allowBooleanAttributes?: boolean;
                                                            unpairedTags?: string[];
                                                        } | boolean): Promise<XMLType> {
    const str = await streamToString(stream)
    return parseXmlString<XMLType>(str, options, validationOptions)
}

export async function parseXmlString<XMLType = unknown>(str: string, options?: X2jOptions,
                                                        validationOptions?: {
                                                            allowBooleanAttributes?: boolean;
                                                            unpairedTags?: string[];
                                                        } | boolean): Promise<XMLType> {
    const parser = options ? new XMLParser(options) : new XMLParser()
    return validationOptions ? await parser.parse(str, validationOptions) : await parser.parse(str)
}

export async function parseJsonStream<JSONType = unknown>(stream: NodeJS.ReadableStream, reviver?: (this: any, key: string, value: any) => any): Promise<JSONType> {
    const str = await streamToString(stream)
    return reviver ? JSON.parse(str, reviver) : JSON.parse(str)
}

interface MultipartFormData {
    fields: Fields;
    files: Files;
}


export async function parseMultipartFormStream<MultipartType extends MultipartFormData = MultipartFormData>(
    req: IncomingMessage,
): Promise<MultipartType> {
    const form = new IncomingForm();
    return new Promise<MultipartType>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                logError('Error parsing form data:', err);
                reject(err);
                return;
            }
            const formData: MultipartType = {fields, files} as MultipartType;
            resolve(formData);
        });
    });
}

export async function parseUrlEncodedFormStream<UrlEncodedType = {
    [key: string]: string | string[]
}>(stream: NodeJS.ReadableStream): Promise<UrlEncodedType> {
    const str = await streamToString(stream)
    return await parseUrlEncodedFormString<UrlEncodedType>(str)
}

export async function parseUrlEncodedFormString<UrlEncodedType = {
    [key: string]: string | string[]
}>(str: string): Promise<UrlEncodedType> {
    return new Promise((resolve, reject) => {
        try {
            const parsedData: UrlEncodedType = parse(str) as UrlEncodedType;
            resolve(parsedData);
        } catch (error) {
            logError('Error parsing URL-encoded form data:', error);
            reject(error);
        }
    })
}

export function formatDateObj(date: Date, format?: string, i18n?: I18nSettings): string {
    return dateFormatter(date, format, i18n)
}

type GenericInterfaceCheck<T> = {
    [K in keyof T]: (value: any) => value is T[K];
};

export function createTypeGuard<T>(checks: GenericInterfaceCheck<T>): (obj: any) => obj is T {
    return function (obj: any): obj is T {
        for (const key in checks) {
            if (checks.hasOwnProperty(key)) {
                const typeCheck = checks[key];
                if (!typeCheck(obj[key])) {
                    return false;
                }
            }
        }
        return true;
    };
}

// const typeGuard = createTypeGuard<MyInterface>({
//     property1: (value): value is string => typeof value === 'string',
//     property2: (value): value is number => typeof value === 'number',
// });

export function formatDateStr(dateStr: string, format: string, i18n?: I18nSettingsOptional): Date | null {
    return dateParser(dateStr, format, i18n)
}

export function generateTimestamp() {
    return new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
}