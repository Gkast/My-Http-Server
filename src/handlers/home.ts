import {MyHttpHandler} from "../my-http/my-http-tools";
import {pageHtmlResponse} from "../my-http/my-http-responses";

export function homeHandler(): MyHttpHandler {
    return async () => {
        const htmlBody = `<h1>This is the Home Page</h1>`
        return pageHtmlResponse({pageTitle: 'Home', htmlBody: htmlBody})
    }
}