import {MyHttpResponse} from "../util/tools";
import {getMimeType} from "./mime-types";
import {htmlPageTemplate} from "./html-templates";

export type PageParams = {
    pageTitle: string;
    htmlBody?: string
}

export function pageHtmlResponse(
    params: PageParams): MyHttpResponse {
    return {
        status: 200,
        headers: {"content-type": getMimeType("html")},
        body: htmlPageTemplate(params)
    }
}

export function pageResponseStream(
    contentType: string,
    pageResponseStream: ((res: NodeJS.WritableStream) => void)): MyHttpResponse {
    return {
        status: 200,
        headers: {"content-type": contentType},
        body: pageResponseStream
    }
}

export function downloadResponse(
    filename: string,
    pageResponse: string | ((res: NodeJS.WritableStream) => void)
): MyHttpResponse {
    return {
        status: 200,
        headers: {"content-disposition": `attachment; ${filename ? `filename=${filename}` : ''}`},
        body: pageResponse
    }
}

export function redirectResponse(location: string): MyHttpResponse {
    return {
        status: 302,
        headers: {location: location},
    }
}

export function pageNotFoundResponse(
    title = 'Page Not Found',
    htmlBody = `<h1>Page Not Found</h1>`): MyHttpResponse {
    return {
        status: 404,
        headers: {'content-type': getMimeType("html")},
        body: htmlPageTemplate({pageTitle: title, htmlBody: htmlBody})
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

