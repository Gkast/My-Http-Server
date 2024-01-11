/**
 * Definition of HTTP methods supported by the router
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

/**
 * Constants representing different node kinds in the router tree
 */
const SKIND = 0;
const PKIND = 1;
const AKIND = 2;
const STAR = 42;
const SLASH = 47;
const COLON = 58;

/**
 * Represents a node in the router tree
 */
class Node {
    label: number;
    prefix: string;
    children: Node[];
    kind: number;
    map: { [key: string]: { handler: any; pnames: string[] } };

    /**
     * Constructor to create a Node
     * @param prefix - Prefix associated with the node
     * @param children - Child nodes
     * @param kind - Kind of node (e.g., SKIND, PKIND, AKIND)
     * @param map - Map of handlers associated with HTTP methods
     */
    constructor(
        prefix = '/',
        children: Node[] = [],
        kind = SKIND,
        map = Object.create(null)
    ) {
        this.label = prefix.charCodeAt(0);
        this.prefix = prefix;
        this.children = children;
        this.kind = kind;
        this.map = map;
    }

    addChild(n: Node) {
        this.children.push(n);
    }

    findChild(c: number, t: number): Node | undefined {
        for (let i = 0, l = this.children.length; i < l; i++) {
            const e = this.children[i];
            if (c === e.label && t === e.kind) {
                return e;
            }
        }
    }

    findChildWithLabel(c: number): Node | undefined {
        for (let i = 0, l = this.children.length; i < l; i++) {
            const e = this.children[i];
            if (c === e.label) {
                return e;
            }
        }
    }

    findChildByKind(t: number): Node | undefined {
        for (let i = 0, l = this.children.length; i < l; i++) {
            const e = this.children[i];
            if (t === e.kind) {
                return e;
            }
        }
    }

    addHandler(method: HttpMethod, handler: any, pnames?: string[]) {
        const pNamesArray = pnames || [];
        this.map[method] = {handler, pnames: pNamesArray};
    }

    findHandler(method: string) {
        return this.map[method];
    }
}

/**
 * Router class that manages routing using a tree-based structure
 */
class Router<Handler = unknown> {
    private readonly tree: Node;

    /**
     * Constructor to create a Router
     */
    constructor() {
        this.tree = new Node();
    }

    /**
     * Adds a route to the router
     * @param method - HTTP method (e.g., GET, POST)
     * @param path - Path associated with the route
     * @param handler - Handler associated with the route
     */
    add(method: HttpMethod, path: string, handler: Handler) {
        let [i, l, pnames, ch, j]: [number, number, any[], number, number] = [0, path.length, [], 0, 0];

        for (; i < l; ++i) {
            ch = path.charCodeAt(i);
            if (ch === COLON) {
                j = i + 1;

                this.insert(method, path.substring(0, i), SKIND, pnames, handler); // Provide pnames to insert method
                while (i < l && path.charCodeAt(i) !== SLASH) {
                    i++;
                }

                pnames.push(path.substring(j, i));
                path = path.substring(0, j) + path.substring(i);
                i = j;
                l = path.length;

                if (i === l) {
                    this.insert(method, path.substring(0, i), PKIND, pnames, handler);
                    return;
                }
                this.insert(method, path.substring(0, i), PKIND, pnames);
            } else if (ch === STAR) {
                this.insert(method, path.substring(0, i), SKIND, pnames);
                pnames.push('*');
                this.insert(method, path.substring(0, l), AKIND, pnames, handler);
                return;
            }
        }
        this.insert(method, path, SKIND, pnames, handler);
    }

    /**
     * Finds a handler for a given method and path
     * @param method - HTTP method (e.g., GET, POST)
     * @param path - Path to find a handler for
     * @returns Tuple containing handler (if found) and parameter values
     */
    find(method: string, path: string): [(Handler | undefined), ({
        name: string,
        value: string | number
    }[] | (undefined | null))] {
        return this.internalFind(method, path, this.tree);
    }

    /**
     * Inserts a route into the router tree
     * @param method - HTTP method (e.g., GET, POST)
     * @param path - Path associated with the route
     * @param t - Type of node (SKIND, PKIND, AKIND)
     * @param pnames - Array of parameter names
     * @param handler - Handler associated with the route
     */
    private insert(
        method: HttpMethod,
        path: string,
        t: number,
        pnames: string[] | undefined,
        handler?: any
    ) {
        let cn = this.tree;
        let prefix: string, sl: number, pl: number, l: number, max: number, n: Node, c: Node | undefined;

        while (true) {
            prefix = cn.prefix;
            sl = path.length;
            pl = prefix.length;
            l = 0;

            max = sl < pl ? sl : pl;
            while (l < max && path.charCodeAt(l) === prefix.charCodeAt(l)) {
                l++;
            }

            if (l < pl) {
                n = new Node(prefix.substring(l), cn.children, cn.kind, cn.map);
                cn.children = [n];

                cn.label = prefix.charCodeAt(0);
                cn.prefix = prefix.substring(0, l);
                cn.map = Object.create(null);
                cn.kind = SKIND;

                if (l === sl) {
                    cn.addHandler(method, handler, pnames);
                    cn.kind = t;
                } else {
                    n = new Node(path.substring(l), [], t);
                    n.addHandler(method, handler, pnames);
                    cn.addChild(n);
                }
            } else if (l < sl) {
                path = path.substring(l);
                c = cn.findChildWithLabel(path.charCodeAt(0));
                if (c !== undefined) {
                    cn = c;
                    continue;
                }
                n = new Node(path, [], t);
                n.addHandler(method, handler, pnames);
                cn.addChild(n);
            } else if (handler !== undefined) {
                cn.addHandler(method, handler, pnames);
            }
            return;
        }
    }

    /**
     * Finds a handler for a given method and path
     * @param method - HTTP method (e.g., GET, POST)
     * @param path - Path to find a handler for
     * @param cn - Current node in the tree (optional)
     * @param n - Counter for parameter values (optional)
     * @param result - Result containing handler and parameter values
     * @returns Tuple containing handler (if found) and parameter values
     */
    private internalFind(
        method: string,
        path: string,
        cn?: Node,
        n: number = 0,
        result: [any | undefined, any[]] = [undefined, []]
    ): [Handler | undefined, { name: string, value: string | number }[] | []] {
        cn = cn || this.tree;
        const sl = path.length;
        const prefix = cn.prefix;
        const pvalues = result[1];
        let i, pl, l, max, c;
        let preSearch;

        if (sl === 0 || path === prefix) {
            const r = cn.findHandler(method);
            if ((result[0] = r && r.handler) !== undefined) {
                const pnames = r.pnames;
                if (pnames !== undefined) {
                    for (i = 0, l = pnames.length; i < l; ++i) {
                        pvalues[i] = {
                            name: pnames[i],
                            value: pvalues[i],
                        };
                    }
                }
            }
            return result;
        }

        pl = prefix.length;
        l = 0;

        max = sl < pl ? sl : pl;
        while (l < max && path.charCodeAt(l) === prefix.charCodeAt(l)) {
            l++;
        }

        if (l === pl) {
            path = path.substring(l);
        }
        preSearch = path;

        c = cn.findChild(path.charCodeAt(0), SKIND);
        if (c !== undefined) {
            this.internalFind(method, path, c, n, result);
            if (result[0] !== undefined) {
                return result;
            }
            path = preSearch;
        }

        if (l !== pl) {
            return result;
        }

        c = cn.findChildByKind(PKIND);
        if (c !== undefined) {
            l = path.length;
            i = 0;
            while (i < l && path.charCodeAt(i) !== SLASH) {
                i++;
            }

            pvalues[n] = path.substring(0, i);

            n++;
            preSearch = path;
            path = path.substring(i);

            this.internalFind(method, path, c, n, result);
            if (result[0] !== undefined) {
                return result;
            }

            n--;
            pvalues.pop();
            path = preSearch;
        }

        c = cn.findChildByKind(AKIND);
        if (c !== undefined) {
            pvalues[n] = path;
            path = '';
            this.internalFind(method, path, c, n, result);
        }

        return result;
    }
}

export default Router;