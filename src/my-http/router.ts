// @ts-ignore
import Router from 'trek-router'
import {MyHttpHandler, MyParams} from "../util/tools";

export type HttpMethod =
    | "GET"
    | "POST"
    | "HEAD"
    | "PUT"
    | "DELETE"
    | "CONNECT"
    | "OPTIONS"
    | "TRACE"
    | "PATCH";

export type Router = {
    add(method: HttpMethod, path: string, handler: MyHttpHandler): void;

    find(
        method: string,
        path: string,
    ): [MyHttpHandler | undefined, MyParams | undefined];
};

export class MyRouter {
    private routes: Router = new Router();

    get(path: string, handler: MyHttpHandler) {
        this.routes.add('GET', path, handler);
    }

    post(path: string, handler: MyHttpHandler) {
        this.routes.add('POST', path, handler);
    }

    put(path: string, handler: MyHttpHandler) {
        this.routes.add('PUT', path, handler);
    }

    delete(path: string, handler: MyHttpHandler) {
        this.routes.add('DELETE', path, handler);
    }

    async findRoute(method: HttpMethod, path: string) {
        return this.routes.find(method, path);
    }
}