import {MyHttpHandler} from "../my-http/my-http-tools";
import {pageHtmlResponse} from "../my-http/my-http-responses";

export function homeHandler(): MyHttpHandler {
    return () => new Promise((resolve) => {
        const htmlBody = `<h1>This is the Home Page</h1>`
        resolve(pageHtmlResponse({pageTitle: 'Home', htmlBody: htmlBody}))
    })
}