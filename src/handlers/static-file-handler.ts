import {MyHttpHandler} from "../my-http/my-http-tools";
import path from "node:path";
import fs from "fs";
import {getMimeType, MimeExtensions} from "../my-http/my-mime-types";
import {logError} from "../util/logger";
import {pageNotFoundResponse} from "../my-http/my-http-responses";

export function staticFileHandler(forcedURL?: string): MyHttpHandler {
    return async (req) => {
        try {
            const decodedPath = decodeURIComponent(req.url.pathname);
            const requestedFilePath = path.join(__dirname, '../..', forcedURL ? `/assets/public/${forcedURL}` : decodedPath);
            const result = await fs.promises.stat(requestedFilePath);
            const ext = decodedPath.split('.').pop();

            if (result.isFile() && ext !== undefined) {
                const forceDownload = req.url.searchParams.get('download') === '1';
                const contentType = getMimeType(ext as MimeExtensions) || getMimeType("bin");

                const fileStream = fs.createReadStream(requestedFilePath);
                fileStream.on('error', (error) => {
                    logError('Error reading file:', error);
                    return {
                        status: 500,
                        headers: {
                            "content-type": getMimeType('pl')
                        },
                        body: 'Internal Server Error'
                    };
                });

                const headers = {
                    'content-type': contentType,
                    'content-length': result.size.toString(),
                    'content-disposition': forceDownload ? 'attachment' : 'inline',
                };

                return {status: 200, headers, body: (res) => fileStream.pipe(res)};
            } else {
                return pageNotFoundResponse('File Not Found', 'File Not Found');
            }
        } catch (error) {
            logError('Error serving static file:', error);
            return {
                status: 500,
                headers: {
                    "content-type": getMimeType('pl')
                },
                body: 'An unexpected error occurred'
            }
        }
    };
}