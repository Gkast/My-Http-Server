import {MyHTTP} from "./my-http/server";
import {initRoutes} from "./init-routes";
import {logError, logInfo} from "./util/logger";
import {initializeGracefulShutdownMechanism} from "./my-http/graceful-shutdown";

logInfo(`Process started with id`, process.pid)

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST
const timeoutMs = 10000

async function startAPI() {
    const myHttp = new MyHTTP(PORT)
    const myRouter = myHttp.getRouter()
    const myServer = myHttp.getServer()
    await initRoutes(myRouter)
    await initializeGracefulShutdownMechanism(myServer, timeoutMs)
    HOST ? myHttp.init(PORT, HOST) : myHttp.init(PORT)
}

process.on('unhandledRejection', (reason, promise) => logError("Unhandled Rejection:", reason, promise));

startAPI().catch(reason => {
    logError(`HTTP API Startup Error:`, reason);
    process.exit(1);
})