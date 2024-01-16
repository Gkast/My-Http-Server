import {HttpStatusCode, MyHttpResponse} from "./my-http-tools";
import {getMimeType, MyMimeTypes} from "./my-mime-types";
import {htmlPageTemplate, notFoundHtmlTemplate} from "./my-html-templates";

export type PageParams = {
    readonly pageTitle: string;
    readonly htmlBody?: string
}

export function pageHtmlResponse(
    params: PageParams, minifyOption = true): MyHttpResponse {
    return {
        status: 200,
        headers: {"content-type": getMimeType("html")},
        minify: minifyOption,
        body: htmlPageTemplate(params)
    }
}

export function pageResponseStream(
    statusCode: HttpStatusCode = 200,
    contentType: MyMimeTypes,
    pageResponseStream: (res: NodeJS.WritableStream) => void): MyHttpResponse {
    return {
        status: statusCode,
        headers: {"content-type": contentType},
        body: pageResponseStream
    }
}

export function downloadResponse(
    statusCode: HttpStatusCode = 200,
    filename: string,
    pageResponse: string | ((res: NodeJS.WritableStream) => void)
): MyHttpResponse {
    return {
        status: statusCode,
        headers: {"content-disposition": `attachment; ${filename ? `filename=${filename}` : ''}`},
        body: pageResponse
    }
}

export function redirectResponse(statusCode: HttpStatusCode = 302, location: string): MyHttpResponse {
    return {
        status: statusCode,
        headers: {location: location},
    }
}

export function pageNotFoundResponse(
    title = 'Page Not Found',
    message = `Page Not Found`): MyHttpResponse {
    return {
        status: 404,
        headers: {'content-type': getMimeType("html")},
        body: notFoundHtmlTemplate(title, message)
    }
}

export function wrongCredentialsResponse(
    title = 'Wrong Credentials',
    htmlBody = `<h1>Wrong Credentials</h1>`
): MyHttpResponse {
    return {
        status: 401,
        headers: {"content-type": getMimeType("html")},
        body: htmlPageTemplate({pageTitle: title, htmlBody: htmlBody})
    }
}

