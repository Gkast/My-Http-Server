import {MyRouter} from "./my-http/my-router";
import {pageNotFoundResponse} from "./my-http/my-http-responses";
import {MyHttpHandler} from "./my-http/my-http-tools";
import {homeHandler} from "./handlers/home";
import {staticFileHandler} from "./handlers/static-file-handler";

export async function initRoutes(router: MyRouter<MyHttpHandler>) {
    router.get('/', homeHandler());
    router.get('/home', homeHandler());

    router.get('/robots.txt', staticFileHandler('robots.txt'));
    router.get('/sitemap.xml', staticFileHandler('sitemap.xml'));
    router.get('/assets/public/*', staticFileHandler());
    router.all('*', () => Promise.resolve(pageNotFoundResponse()));
}