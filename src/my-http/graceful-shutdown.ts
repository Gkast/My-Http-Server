import {Server} from "http";
import {logError, logInfo} from "../util/logger";

export async function initializeGracefulShutdownMechanism(httpServer: Server, timeoutMs: number) {
    logInfo('Initializing Graceful Shutdown Mechanism');
    const handleGracefulShutdown = async (signal: string) => {
        logInfo('Received', signal);
        await gracefulShutdown(httpServer, timeoutMs);
    };
    process.once('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => handleGracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => {
        logError('\nReceived SIGUSR2. Exiting Forcefully');
        process.exit(2);
    });
    logInfo('Graceful Shutdown Mechanism Initialized');
}

export async function gracefulShutdown(httpServer: Server, timeoutMs: number) {
    try {
        logInfo('Shutting Down Gracefully');
        let timeout: NodeJS.Timeout | null = null;
        await new Promise<void>((resolve, reject) => {
            timeout = setTimeout(() => {
                logError('Forcefully terminating due to timeout');
                reject(new Error('Forcefully terminating due to timeout'));
            }, timeoutMs);
            logInfo('Closing HTTP Server');
            httpServer.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    logInfo('HTTP Server Closed');
                    resolve();
                }
            });
        });
        if (timeout) clearTimeout(timeout);
        logInfo('Exiting...');
        process.exit(0);
    } catch (err) {
        logError('Error Occurred While Closing Gracefully', err);
        process.exit(1);
    }
}