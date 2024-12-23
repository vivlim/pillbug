import { Logger } from "tslog";

export type PillbugPath = string;

export interface IPillbugFilesystem {
    writeText(path: PillbugPath, stringToWrite: string, options: { append: boolean; line: boolean; }, logger: Logger<unknown>): Promise<void>;
    write(path: PillbugPath, dataToWrite: AllowSharedBufferSource, options: { append: boolean }, logger: Logger<unknown>): Promise<void>;

}