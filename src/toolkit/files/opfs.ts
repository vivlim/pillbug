import { error } from "console";
import { logger } from "~/logging";

export async function getFsRoot(): Promise<FileSystemDirectoryHandle> {
    return await navigator.storage.getDirectory()
}

export async function getFileAtPath(path: string, fs: FileSystemDirectoryHandle, opts: { create: boolean }): Promise<FileSystemFileHandle | null> {
    const pathParts = path.split("/").filter(p => p.length > 0);
    let targetDir = fs;
    while (pathParts.length > 1) {
        const dir = pathParts.splice(0, 1)[0];
        targetDir =
            await targetDir.getDirectoryHandle(
                dir,
                { create: opts.create }
            );
    }

    return targetDir.getFileHandle(pathParts[0], {
        create: opts.create,
    });
}

export async function createFileAtPromptedPath(fs: FileSystemDirectoryHandle): Promise<FileSystemFileHandle | null> {
    const fn = prompt(
        "Please enter a path for the new file"
    );
    if (fn === null) {
        return null;
    }
    try {
        return await getFileAtPath(fn, fs, { create: true });
    }
    catch (e) {
        if (e instanceof Error) {
            const msg = `Failed to create file ${fn}: ${e.message}`
            alert(msg);
            console.error(e);
        }
        return null
    }
}

export function dirname(path: string): string {
    const parts = path.split("/");
    if (parts.length > 0) {
        parts.pop()!;
    }
    return "/" + parts.filter(p => p.length > 0).join("/");
}

export function basename(path: string): string {
    const parts = path.split("/");
    return parts[parts.length - 1];
}

export function pathjoin(path: string, ...parts: string[]): string {
    let newParts = path.split("/");
    newParts = newParts.concat(parts);
    return "/" + newParts.filter(p => p.length > 0).join("/");
}

export async function exportFileAtPath(path: string, fs: FileSystemDirectoryHandle) {
    try {
        const handle = await getFileAtPath(path, fs, { create: false });
        if (handle instanceof FileSystemFileHandle) {
            const file = await handle!.getFile()
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(file);
            elem.download = basename(path);
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        }
        else {
            logger.error(`path ${path} doesn't exist or isn't exportable`)
        }
    }
    catch (e) {
        if (e instanceof Error) {
            logger.error(`path ${path} doesn't exist or isn't exportable`, e)
        }

    }
}

export async function deleteFileAtPath(path: string, fs: FileSystemDirectoryHandle) {
    const pathParts = path.split("/").filter(p => p.length > 0);
    let targetDir = fs;
    while (pathParts.length > 1) {
        const dir = pathParts.splice(0, 1)[0];
        targetDir =
            await targetDir.getDirectoryHandle(
                dir,
            );
    }

    let targetHandle;
    for await (let [name, h] of fs.entries()) {
        if (name === pathParts[0]) {
            targetHandle = h;
            break;
        }

    }
    if (targetHandle === undefined) { throw new Error(`couldn't find file to remove: ${path}`) }
    if (targetHandle.kind === "file") {
        await targetDir.removeEntry(pathParts[0]);
        return;
    }
    else if (targetHandle.kind === "directory" && targetHandle instanceof FileSystemDirectoryHandle) {
        for await (let [innerName] of targetHandle.entries()) {
            targetHandle.removeEntry(innerName);
        }

        targetDir.removeEntry(pathParts[0]);
    }
}