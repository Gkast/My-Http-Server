import Router, {HttpMethod} from './trie-http-router'
import {MyHttpHandler} from "../util/tools";
import {logInfo} from "../util/logger";

export type MyRouter = ReturnType<typeof createMyRouter>;

function createMyRouter() {
    logInfo('Initializing HTTP Router...')
    const routes = new Router<MyHttpHandler>();

    function add(method: HttpMethod, path: string, handler: MyHttpHandler) {
        routes.add(method, path, handler);
    }

    function get(path: string, handler: MyHttpHandler) {
        add('GET', path, handler);
    }

    function post(path: string, handler: MyHttpHandler) {
        add('POST', path, handler);
    }

    function put(path: string, handler: MyHttpHandler) {
        add('PUT', path, handler);
    }

    function del(path: string, handler: MyHttpHandler) {
        add('DELETE', path, handler);
    }

    function all(path: string, handler: MyHttpHandler) {
        get(path, handler)
        post(path, handler)
        put(path, handler)
        del(path, handler)
    }

    function find(method: string, path: string) {
        return routes.find(method, path);
    }

    return {get, post, put, del, all, find};
}

export default createMyRouter;