import {
    Component,
    createEffect,
    createResource,
    createUniqueId,
    For,
    JSX,
    Match,
    Show,
    Switch,
} from "solid-js";
import { StoreBacked } from "~/lib/store-backed";
import { FilesFacetStore } from ".";
import { handler } from "tailwindcss-animate";
import { FaRegularFile, FaRegularFolder, FaSolidFile } from "solid-icons/fa";
import { createStore, produce } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { getFileAtPath } from "./opfs";
import { TextEditor } from "./texteditor";
import { Button } from "~/components/ui/button";

export type MultiFileViewerProps = {
    opfs?: FileSystemDirectoryHandle;
    facetStore: StoreBacked<FilesFacetStore>;
};

export class OpenedFile {
    constructor(public handle: FileSystemHandle, public path: string) {}
}

export const MultiFileViewer: Component<MultiFileViewerProps> = (props) => {
    const [openedFiles, setOpenedFiles] = createStore<OpenedFile[]>([]);
    createEffect(async () => {
        const currentFile = props.facetStore.store.currentFile;
        if (currentFile === undefined || props.opfs === undefined) {
            return;
        }
        // Check if current file is open
        const openFileNames = openedFiles.map((f) => f.path);
        const i = openFileNames.indexOf(currentFile);
        if (i >= 0) {
            // already open
            console.log(`file ${currentFile} is already open`);
            return;
        }

        console.log(`attempting to open file ${currentFile}`);
        const f = await getFileAtPath(currentFile, props.opfs, {
            create: false,
        });
        if (f === null) {
            console.error(`failed to open file ${currentFile}`);
            return;
        }

        setOpenedFiles(openedFiles.length, new OpenedFile(f, currentFile));
    });

    return (
        <For each={openedFiles}>
            {(f, idx) => {
                return (
                    <div class="pbCard window" style="height:100%">
                        <div class="pbPostUserBar titleBar">
                            <div class="title">{f.path}</div>
                            <Button
                                onClick={() => {
                                    setOpenedFiles(
                                        produce((of) => {
                                            of.splice(idx());
                                            return [];
                                        })
                                    );
                                }}
                            >
                                X
                            </Button>
                        </div>
                        <TextEditor file={f} />
                    </div>
                );
            }}
        </For>
    );
};
