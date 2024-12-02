import * as Comlink from "comlink";
import { IPillbugFilesystem, PillbugPath } from "../ipillbugfilesystem";
import { Logger } from "tslog";
import { getFileAtPath } from "../opfs";

class PillbugFilesystemWorker implements IPillbugFilesystem {
    private logger: Logger<unknown> = null!;
    private encoder: TextEncoder = new TextEncoder();

    constructor() {

    }
    public async writeText(path: PillbugPath, stringToWrite: string, options: { append: boolean; line: boolean; }, logger: Logger<unknown>): Promise<void> {
        const fileHandle = await this.fileHandleForPath(path, { create: true }, logger);

        await this.fileWriteLock(path, async () => {
            const accessHandle = await fileHandle.createSyncAccessHandle()
            if (options.line) {
                const size = accessHandle.getSize();
                if (size > 0) {
                    stringToWrite = "\n" + stringToWrite;
                }
            }

            const bytes = this.encoder.encode(stringToWrite);
            await this.writeInner(accessHandle, bytes, options);
        });
    }

    public async write(path: PillbugPath, dataToWrite: AllowSharedBufferSource, options: { append: boolean }, logger: Logger<unknown>): Promise<void> {
        const fileHandle = await this.fileHandleForPath(path, { create: true }, logger);
        await this.fileWriteLock(path, async () => {
            const accessHandle = await fileHandle.createSyncAccessHandle()
            await this.writeInner(accessHandle, dataToWrite, options);
        });
    }

    async writeInner(accessHandle: FileSystemSyncAccessHandle, dataToWrite: AllowSharedBufferSource, options: { append: boolean; }) {
        if (options.append) {
            const size = accessHandle.getSize();
            accessHandle.write(dataToWrite, { at: size });
        }
        else {
            if (accessHandle.getSize() > 0) {
                accessHandle.truncate(0);
            }
            accessHandle.write(dataToWrite);
        }

        accessHandle.flush();
        accessHandle.close();
    }

    setLogger(l: Logger<unknown>): void {
        if (this.logger !== null) {
            this.logger.info("existing shared worker logger is being replaced by another logger.");
        }
    }

    async fileHandleForPath(path: PillbugPath, options: { create: boolean }, logger: Logger<unknown>): Promise<FileSystemFileHandle> {
        const fileHandle = await getFileAtPath(path, await this.rootAsync, options);
        if (fileHandle === null) {
            logger.error("failed to get file handle for path", path);
            throw new Error("failed to get file handle");
        }

        return fileHandle;
    }

    fileWriteLock(path: PillbugPath, callback: LockGrantedCallback) {
        return navigator.locks.request(`file_write_${path}`, callback);
    }

    get rootAsync(): Promise<FileSystemDirectoryHandle> {
        return navigator.storage.getDirectory();
    }
}


const fs = new PillbugFilesystemWorker();

Comlink.expose(fs);