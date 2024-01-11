import Router, {HttpMethod} from './trie-http-router'
import {logInfo} from "../util/logger";

export type MyRouter<Handler = unknown> = ReturnType<typeof createMyRouter<Handler>>;

function createMyRouter<Handler = unknown>() {
    logInfo('Initializing HTTP Router...')
    const routes = new Router<Handler>();

    function add(method: HttpMethod, path: string, handler: Handler) {
        routes.add(method, path, handler);
    }

    function get(path: string, handler: Handler) {
        add('GET', path, handler);
    }

    function post(path: string, handler: Handler) {
        add('POST', path, handler);
    }

    function put(path: string, handler: Handler) {
        add('PUT', path, handler);
    }

    function del(path: string, handler: Handler) {
        add('DELETE', path, handler);
    }

    function all(path: string, handler: Handler) {
        get(path, handler)
        post(path, handler)
        put(path, handler)
        del(path, handler)
    }

    function find(method: string, path: string) {
        return routes.find(method, path);
    }

    return {get, post, put, del, all, find, add};
}

export default createMyRouter;