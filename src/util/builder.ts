import fs from "fs/promises";
import {minify as jsMinifier} from "terser";
import {minify as cssMinifier, Result} from 'csso'
import path from "node:path";
import {logError, logInfo} from "./logger";
import {directoryExists} from "./util";

async function createDirectoryIfNotExists(directoryPath: string): Promise<void> {
    if (await directoryExists(directoryPath)) {
        logInfo(`Directory "${directoryPath}" already exists.`);
        return;
    }
    try {
        await fs.mkdir(directoryPath, {recursive: true});
        logInfo(`Directory "${directoryPath}" has been created.`);
    } catch (error) {
        logError(`Error creating directory "${directoryPath}":`, error);
        throw error;
    }
}

async function minifyCSSFiles(directoryPath: string) {
    try {
        logInfo('Minifying CSS files...')
        const files = await fs.readdir(directoryPath);
        await Promise.all(files.map(async file => {
            const filePath = path.join(directoryPath, file);
            const {name} = path.parse(filePath);
            const content = await fs.readFile(filePath, "utf-8");
            const minifiedContent: Result = await new Promise((resolve, reject) => {
                try {
                    resolve(cssMinifier(content))
                } catch (err) {
                    logError('Error minifying css file', err)
                    reject(err)
                }
            });
            if (minifiedContent.css) {
                const minFilePath = path.join(path.dirname(filePath), "min", `${name}.min.css`);
                await createDirectoryIfNotExists(path.dirname(minFilePath));
                await fs.writeFile(minFilePath, minifiedContent.css, "utf-8");
                logInfo(`File "${minFilePath}" has been created.`);
            }
        }));
    } catch (err) {
        logError('Error reading directory:', directoryPath, err);
    }
}

async function minifyJSFiles(directoryPath: string) {
    try {
        logInfo('Minifying JS files...')
        const files = await fs.readdir(directoryPath);
        await Promise.all(files.map(async file => {
            const filePath = path.join(directoryPath, file);
            const {name} = path.parse(filePath);
            const content = await fs.readFile(filePath, "utf-8");
            const minifiedContent = await jsMinifier(content);
            if (minifiedContent.code) {
                const minFilePath = path.join(path.dirname(filePath), "min", `${name}.min.js`);
                await createDirectoryIfNotExists(path.dirname(minFilePath));
                await fs.writeFile(minFilePath, minifiedContent.code, "utf-8");
                logInfo(`File "${minFilePath}" has been created.`);
            }
        }));
    } catch (err) {
        logError('Error reading directory:', directoryPath, err);
    }
}

async function minify() {
    logInfo('Minification process started...')
    const assetsPath = process.env.ASSETS_DIR || path.join(__dirname, '../..', 'assets', 'public');
    const jsPath = path.join(assetsPath, 'js')
    const cssPath = path.join(assetsPath, 'css')
    logInfo(`Assets Path: ${assetsPath}\nJS Path: ${jsPath}\nCSS Path: ${cssPath}`)
    await minifyJSFiles(jsPath);
    await minifyCSSFiles(cssPath)
}

minify().catch(reason => logError(`Error Minification`, reason));
