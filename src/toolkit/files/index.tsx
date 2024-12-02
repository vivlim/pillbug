import {
    Component,
    createEffect,
    createMemo,
    createResource,
    onCleanup,
    onMount,
    Show,
} from "solid-js";
import { useFrameContext } from "~/components/frame/context";
import { LayoutLeftColumnPortal } from "~/components/layout/columns";
import { FileTree } from "./filetree";
import { TextEditor } from "./texteditor";
import { Button } from "~/components/ui/button";
import { StoreBacked } from "~/lib/store-backed";
import "./files.css";
import {
    createFileAtPromptedPath,
    deleteFileAtPath,
    dirname,
    exportFileAtPath,
    getFileAtPath,
    pathjoin,
} from "./opfs";
import { getFilesFromInput } from "~/components/editor/attachments";
import { SingleFileViewer } from "./fileViewer";
import { useSearchParams } from "@solidjs/router";

export interface FilesFacetStore {
    currentFile?: string;
}

const FilesFacet: Component = () => {
    const [searchParams, setSearchParams] = useSearchParams();
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

    createEffect(() => {
        if (facetStore.store.currentFile !== undefined) {
            setSearchParams(
                { path: facetStore.store.currentFile },
                { scroll: true }
            );
        }
    });

    return (
        <div>
            <Show when={!opfs.loading}>
                <LayoutLeftColumnPortal>
                    <div class="pbCard fileTreeLeftColumn">
                        <FileTree
                            opfs={opfs()}
                            facetStore={facetStore}
                        ></FileTree>
                        <Button
                            onClick={async () => {
                                const handle = await createFileAtPromptedPath(
                                    opfs()!
                                );
                                if (handle !== null) {
                                    opfsResourceAction.refetch();
                                }
                            }}
                        >
                            New file
                        </Button>
                        <Button
                            onClick={async () => {
                                try {
                                    const files = await getFilesFromInput({
                                        multiple: true,
                                    });
                                    const destination = dirname(
                                        facetStore.store.currentFile ?? ""
                                    );
                                    for (var file of files) {
                                        const destinationFilePath = pathjoin(
                                            destination,
                                            file.name
                                        );

                                        console.log(
                                            "importing file " +
                                                destinationFilePath
                                        );

                                        const handle = await getFileAtPath(
                                            destinationFilePath,
                                            opfs()!,
                                            { create: true }
                                        );
                                        // todo: don't clobber existing files, prompt
                                        const file = await handle?.getFile();

                                        const writable = await handle
                                            ?.getFile()!
                                            .createWritable({
                                                keepExistingData: false,
                                            });
                                        await file.stream().pipeTo(writable);
                                        console.log(
                                            "successfully imported file " +
                                                destinationFilePath
                                        );
                                    }

                                    opfsResourceAction.refetch();
                                } catch (e) {
                                    if (e instanceof Error) {
                                        const msg = `Failed to import file: ${e.message}`;
                                        alert(msg);
                                        console.error(e);
                                    }
                                }
                            }}
                        >
                            Import
                        </Button>
                        <Button
                            onClick={async () => {
                                if (
                                    window.confirm(
                                        `Really delete ${searchParams.path}?`
                                    )
                                ) {
                                    await deleteFileAtPath(
                                        searchParams.path!,
                                        opfs()!
                                    );

                                    opfsResourceAction.refetch();
                                }
                            }}
                            disabled={searchParams.path === undefined}
                        >
                            Delete selected
                        </Button>
                        <Button
                            onClick={async () => {
                                await exportFileAtPath(
                                    searchParams.path!,
                                    opfs()!
                                );
                            }}
                            disabled={searchParams.path === undefined}
                        >
                            Export selected
                        </Button>
                    </div>
                </LayoutLeftColumnPortal>
                <Show when={searchParams.path !== undefined}>
                    <SingleFileViewer
                        path={searchParams.path!}
                        opfs={opfs()}
                    ></SingleFileViewer>
                </Show>
            </Show>
        </div>
    );
};

export default FilesFacet;
