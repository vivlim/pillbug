import { ISettingsParam, Logger } from "tslog";
import { getFileAtPath } from "./toolkit/files/opfs";
import { DateTime } from "luxon";

class PillbugLogger<T> extends Logger<T> {
    constructor(settings?: ISettingsParam<T>, logObj?: T) {
        super(settings, logObj);
        // @ts-ignore need to set this private var as a workaround for https://github.com/fullstack-build/tslog/issues/302
        this.stackDepthLevel = 6
    }
}

function isChromium() {
    return window.chrome !== undefined;
}

export const logger = new PillbugLogger<unknown>({
    name: "app",
    minLevel: 3,
    prettyLogTemplate: "[{{dateIsoStr}} {{logLevelName}} {{name}} {{fileNameWithLine}}] ",
    stylePrettyLogs: isChromium()
})


export async function attachFileLoggerTransport() {
    const fs = await navigator.storage.getDirectory();
    const ts = DateTime.now().toFormat("yy-MM-dd_HH-mm-ss");
    const path = `logs/pillbug-${ts}.log`
    const fileHandle = await getFileAtPath(path, fs, { create: true });
    const encoder = new TextEncoder();
    let reportedError = false;

    logger.attachTransport(async (logObj) => {
        try {
            const existing = await fileHandle?.getFile()
            const writable = await fileHandle!.createWritable({ keepExistingData: true });
            try {
                if (existing !== undefined) {

                    writable.seek(existing.size)
                }
                const d = DateTime.fromJSDate(logObj._meta.date).toISO();
                const logLine = `[${d} ${logObj._meta.logLevelName} ${logObj._meta.name}] ${logObj[0]}`
                await writable.write(encoder.encode(logLine + "\n"));
            }
            catch (e) {
                if (!reportedError) {
                    logger.error("failed to write to log file", e)
                    reportedError = true;
                }

            }
            finally {
                await writable.close()
            }
        }
        catch (e) {
            if (!reportedError) {
                logger.error("failed to get log file handle", e)
                reportedError = true;
            }

        }
    })
    logger.info(`writing log to origin-private filesystem at path: ${path}`)
}