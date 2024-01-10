import {initRoutes} from "./init-routes";
import {logError, logFatal, logInfo, logWarn} from "./util/logger";
import {initializeGracefulShutdownMechanism} from "./my-http/graceful-shutdown";
import createMyRouter from "./my-http/my-router";
import {createMyHttpServer} from "./my-http/my-http-server";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST
const timeoutMs = 10000

logInfo(`Process started with id`, process.pid)
process.on('warning', (warning) => logWarn(`${warning.name}\n${warning.message}\n${warning.stack}`));
process.on('exit', (code) => logInfo('Process exit event with code:', code));
process.on('uncaughtException', (error, origin) => {
    logFatal('Uncaught Exception occurred: ', error, origin)
    process.exit(7)
});
process.on('unhandledRejection', (reason, promise) => logError("Unhandled Rejection:", reason, promise));

async function startAPI() {
    const myRouter = createMyRouter()
    await initRoutes(myRouter)
    const myHttpServer = createMyHttpServer(PORT, myRouter)
    await initializeGracefulShutdownMechanism(myHttpServer, timeoutMs)
    HOST ?
        myHttpServer.listen(PORT, HOST, () => logInfo(`Server is listening at http://${HOST}:${PORT}`)) :
        myHttpServer.listen(PORT, () => logInfo(`Server is listening at http://0.0.0.0:${PORT}`))
}

startAPI().catch(reason => {
    logError(`HTTP API Startup Error:`, reason);
    process.exit(1);
})