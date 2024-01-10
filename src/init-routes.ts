import {MyRouter} from "./my-http/my-router";
import {pageHtmlResponse, pageNotFoundResponse} from "./my-http/http-responses";

export async function initRoutes(router: MyRouter) {
    router.get('/', () => Promise.resolve(pageHtmlResponse({pageTitle: 'Home'})))
    router.all('*', () => Promise.resolve(pageNotFoundResponse()))
}