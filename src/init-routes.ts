import {MyRouter} from "./my-http/my-router";
import {pageHtmlResponse, pageNotFoundResponse} from "./my-http/http-responses";
import {MyHttpHandler} from "./util/tools";
import {staticFileReqList} from "./util/util";

export async function initRoutes(router: MyRouter<MyHttpHandler>) {
    router.get('/', () => Promise.resolve(pageHtmlResponse({pageTitle: 'Home'})))
    router.get('/assets/public/*', staticFileReqList())
    router.all('*', () => Promise.resolve(pageNotFoundResponse()))
}