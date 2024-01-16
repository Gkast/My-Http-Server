import {PageParams} from "./my-http-responses";

export function htmlPageTemplate(params: PageParams): string {
    return htmlTopPageTemplate(params) + (params.htmlBody ? params.htmlBody : '') + htmlBottomPageTemplate()
}

export function htmlTopPageTemplate(params: PageParams): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${params.pageTitle}</title>
    <link rel="stylesheet" type="text/css" href='${process.env.NODE_ENV === 'production' ? '/assets/public/css/min/main.min.css' : '/assets/public/css/main.css'}'>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <header>
        <div>
            <h1><a href="/" title="Home">My HTTP Header</a></h1>
        </div>
        <nav>
            ${navHtml()}
        </nav>
    </header>
    <main>
        <article>`;
}

export function htmlBottomPageTemplate(): string {
    return `</article>
    </main>
    <footer>
        ${footerHtml()}
    </footer>
    <script type="text/javascript">{
var deps = {};
var funcs = {};
var cache = {};
function define(key, d, func) {
    deps[key] = d;
    funcs[key] = func;
}
function require(key) {
    if (key === 'require') return require;
    if (key === 'exports') return {};
    var cached = cache[key];
    if(cached) return cached;
    var resolved = deps[key].map(require);
    funcs[key].apply(null, resolved);
    return cache[key] = resolved[1];
}}</script>
<script src='${process.env.NODE_ENV === 'production' ? '/assets/public/js/min/main.min.js' : '/assets/public/js/main.js'}'></script>
<script type="text/javascript">{Object.keys(deps).forEach(depName => require(depName))}</script>
</body>
</html>`;
}

export function navHtml(): string {
    return `
    <div>
        <a href="/login">
        <button>Log In</button>
    </a>
    <a href="/register">
    <button>Register</button>
        </a>
        </div>`
}

export function footerHtml(): string {
    return `<div>
        <span>My HTTP Footer</span>
    </div>`
}

export function notFoundHtmlTemplate(title: string, message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>${title}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <h1 style="text-align: center; margin-top: 24px">${message}</h1>
  </body>
</html>
`
}