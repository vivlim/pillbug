import { Component, createResource, onCleanup, onMount, Show } from "solid-js";
import { useFrameContext } from "~/components/frame/context";
import { LayoutLeftColumnPortal } from "~/components/layout/columns";
import { FileTree } from "./filetree";
import { TextEditor } from "./texteditor";
import { Button } from "~/components/ui/button";
import { StoreBacked } from "~/lib/store-backed";
import "./files.css";

export interface FilesFacetStore {
    currentFile?: string;
}

const FilesFacet: Component = () => {
    const facetStore = new StoreBacked<FilesFacetStore>({});
    const frameContext = useFrameContext();
    onMount(() => {
        frameContext.setShowNav(false);
    });
    onCleanup(() => {
        frameContext.setShowNav(true);
    });

    const [opfs, opfsResourceAction] =
        createResource<FileSystemDirectoryHandle>(() =>
            navigator.storage.getDirectory()
        );

    return (
        <div style="height:80vh;">
            <Show when={!opfs.loading}>
                <LayoutLeftColumnPortal>
                    <div class="pbCard fileTreeLeftColumn">
                        <FileTree
                            opfs={opfs()}
                            facetStore={facetStore}
                        ></FileTree>
                        <Button
                            onClick={async () => {
                                const fn = prompt(
                                    "Please enter a path for the new file"
                                );
                                if (fn === null) {
                                    return;
                                }
                                const pathParts = fn.split("/");
                                let targetDir = opfs()!;
                                while (pathParts.length > 1) {
                                    const dir = pathParts.splice(0, 1)[0];
                                    targetDir =
                                        await targetDir.getDirectoryHandle(
                                            dir,
                                            { create: true }
                                        );
                                }

                                targetDir.getFileHandle(pathParts[0], {
                                    create: true,
                                });
                                opfsResourceAction.refetch();
                            }}
                        >
                            New file
                        </Button>
                        <Button
                            onClick={async () => {
                                const fn = prompt(
                                    "Please enter a name for the new directory"
                                );
                                if (fn === null) {
                                    return;
                                }
                                opfs()?.getDirectoryHandle(fn, {
                                    create: true,
                                });
                                opfsResourceAction.refetch();
                            }}
                        >
                            New folder
                        </Button>
                    </div>
                </LayoutLeftColumnPortal>
                <TextEditor facetStore={facetStore}></TextEditor>
            </Show>
        </div>
    );
};

export default FilesFacet;
