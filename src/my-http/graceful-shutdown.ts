import {logError, logInfo} from "../util/logger";
import {MyHttpServer} from "./my-http-server";

export async function initializeGracefulShutdownMechanism(myHttpServer: MyHttpServer, timeoutMs: number) {
    logInfo('Initializing Graceful Shutdown Mechanism...');
    const handleGracefulShutdown = (signal: string) => {
        logInfo('\nReceived', signal);
        gracefulShutdown(myHttpServer, timeoutMs);
    };
    process.once('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => handleGracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => {
        logError('\nReceived SIGUSR2. Exiting Forcefully');
        process.exit(2);
    });
}

export function gracefulShutdown(myHttpServer: MyHttpServer, timeoutMs: number) {
    try {
        logInfo('Shutting Down Gracefully...');
        const timeout = setTimeout(() => {
            logError('Forcefully terminating due to timeout');
            process.exit(1)
        }, timeoutMs);

        logInfo('Closing HTTP Server...');
        myHttpServer.close((err) => {
            if (err) {
                process.exit(1)
            }
            myHttpServer.closeIdleConnections()
            if (timeout) clearTimeout(timeout);
            process.exit(0);
        });
    } catch (err) {
        logError('Error Occurred While Closing Gracefully', err);
        process.exit(1);
    }
}