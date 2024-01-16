import {IncomingMessage} from "http";
import {Fields, Files, IncomingForm} from "formidable";
import {logError} from "./logger";
import {parse} from "node:querystring";
import {transform} from "camaro";
import {ParsedUrlQuery, ParseOptions} from "querystring";

export function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => Buffer.isBuffer(chunk) ? chunks.push(chunk) : reject(new Error('Received non-buffer data')));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => chunks.length === 0 ? resolve('') : resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

export async function parseXmlStream<XMLType = unknown>(xmlStream: NodeJS.ReadableStream, template: object): Promise<XMLType> {
    const str = await streamToString(xmlStream)
    return parseXmlString<XMLType>(str, template)
}

export async function parseXmlString<XMLType = unknown>(xmlString: string, template: object): Promise<XMLType> {
    return await transform(xmlString, template) as Promise<XMLType>
}

export async function parseJsonStream<JSONType = unknown>(jsonStream: NodeJS.ReadableStream): Promise<JSONType> {
    const str = await streamToString(jsonStream)
    return JSON.parse(str) as JSONType
}

interface MultipartFormData {
    fields: Fields;
    files: Files;
}

export async function parseMultipartFormStream(
    req: IncomingMessage,
): Promise<MultipartFormData> {
    const form = new IncomingForm();
    return new Promise<MultipartFormData>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                logError('Error parsing form data:', err);
                reject(err);
                return;
            }
            const formData: MultipartFormData = {fields, files} as MultipartFormData;
            resolve(formData);
        });
    });
}

export async function parseUrlEncodedFormStream<UrlEncodedType extends ParsedUrlQuery>(stream: NodeJS.ReadableStream): Promise<UrlEncodedType> {
    const str = await streamToString(stream)
    return await parseUrlEncodedFormString<UrlEncodedType>(str)
}

export async function parseUrlEncodedFormString<UrlEncodedType extends ParsedUrlQuery>(
    str: string, sep?: string, eq?: string, options?: ParseOptions): Promise<UrlEncodedType> {
    return new Promise((resolve, reject) => {
        try {
            const parsedData: UrlEncodedType = parse(str, sep, eq, options) as UrlEncodedType;
            resolve(parsedData);
        } catch (error) {
            logError('Error parsing URL-encoded form data:', error);
            reject(error);
        }
    })
}