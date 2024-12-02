import * as Comlink from "comlink";
import { ISettingsParam, Logger } from "tslog";
import { getFileAtPath, PillbugFilesystem } from "./toolkit/files/opfs";
import { DateTime } from "luxon";

export class PillbugLogger<T> extends Logger<T> {
    constructor(settings?: ISettingsParam<T>, logObj?: T) {
        super(settings, logObj);
        // @ts-ignore need to set this private var as a workaround for https://github.com/fullstack-build/tslog/issues/302
        this.stackDepthLevel = 6
    }
}

function isChromium() {
    // Check if window is defined in case this is called in a worker
    if (typeof window === "undefined") { return undefined; }

    return window?.chrome !== undefined;
}

const loggerImpl = new PillbugLogger<unknown>({
    name: "app",
    minLevel: 3,
    prettyLogTemplate: "[{{dateIsoStr}} {{logLevelName}} {{name}} {{fileNameWithLine}}] ",
    stylePrettyLogs: isChromium()
})

export const logger = Comlink.proxy(loggerImpl)

// alternate name for convenience, when 'logger' is already used
export const pillbugGlobalLogger = logger;




export async function attachFileLoggerTransport() {
    const ts = DateTime.now().toFormat("yy-MM-dd_HH-mm-ss");
    const path = `logs/pillbug-${ts}.log`
    let reportedError = false;

    loggerImpl.attachTransport(async (logObj) => {
        try {
            const fs = PillbugFilesystem.value;
            try {
                const d = DateTime.fromJSDate(logObj._meta.date).toISO();
                const logLine = `[${d} ${logObj._meta.logLevelName} ${logObj._meta.name}] ${logObj[0]}`
                await fs.writeText(path, logLine, { append: true, line: true }, logger /* must pass the proxy here */);
            }
            catch (e) {
                if (!reportedError) {
                    loggerImpl.error("failed to write to log file", e)
                    reportedError = true;
                }

            }
        }
        catch (e) {
            if (!reportedError) {
                loggerImpl.error("failed to get log file handle", e)
                reportedError = true;
            }

        }
    })
    loggerImpl.info(`writing log to origin-private filesystem at path: ${path}`)
}