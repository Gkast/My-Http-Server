import {MyRouter} from "./my-http/router";
import {pageHtmlResponse} from "./my-http/http-responses";

export async function initRoutes(router: MyRouter) {
    router.get('/', () => Promise.resolve(pageHtmlResponse({pageTitle: 'Home'})))
}