
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

export function pathjoin(path: string, ...parts: string[]): string {
    let newParts = path.split("/");
    newParts = newParts.concat(parts);
    return "/" + newParts.filter(p => p.length > 0).join("/");
}
