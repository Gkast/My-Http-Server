import {logError} from "./logger";
import {format as dateFormatter, I18nSettings, I18nSettingsOptional, parse as dateParser} from "fecha";
import fs from "fs/promises";


export function formatDateObj(date: Date, format?: string, i18n?: I18nSettings): string {
    return dateFormatter(date, format, i18n)
}

type GenericInterfaceCheck<T> = {
    [K in keyof T]: (value: unknown) => value is T[K];
};

export function createTypeGuard<T>(checks: GenericInterfaceCheck<T>): (obj: unknown) => obj is T {
    return function (obj: any): obj is T {
        for (const key in checks) {
            if (checks.hasOwnProperty(key)) {
                const typeCheck = checks[key];
                if (!typeCheck(obj[key])) {
                    return false;
                }
            }
        }
        return true;
    };
}

// const typeGuard = createTypeGuard<MyInterface>({
//     property1: (value): value is string => typeof value === 'string',
//     property2: (value): value is number => typeof value === 'number',
// });

export function formatDateStr(dateStr: string, format: string, i18n?: I18nSettingsOptional): Date | null {
    return dateParser(dateStr, format, i18n)
}

export function generateTimestamp() {
    return new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
}

export async function directoryExists(directoryPath: string): Promise<boolean> {
    try {
        await fs.access(directoryPath);
        return true;
    } catch (err) {
        logError('Error accessing the given directory:', directoryPath, err);
        return false;
    }
}