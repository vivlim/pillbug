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
import { OpenedFile } from "./fileViewer";

export type SavedPostViewerProps = {
    file: OpenedFile;
};

export const TextEditor: Component<TextEditorProps> = (props) => {
    const [code, setCode] = createSignal("loading");

    const [fetchFileContents, fetchAction] = createResource(
        () => props.file,
        async (f) => {
            if (f.handle instanceof FileSystemFileHandle) {
                const file = await f.handle.getFile();
                const contents = await file.arrayBuffer();
                const text = new TextDecoder().decode(contents);

                setCode(text);
                setReadOnly(false);
                //args.editorView.setState(EditorState.create({ doc: text }));
                return text;
            } else {
                console.log(`handle is not a file handle for ${f.path}`);
            }
        }
    );

    return (
        <Show when={!fetchFileContents.loading} fallback="reading file">
            <div>
                <Button
                    onClick={async () => {
                        if (props.file.handle instanceof FileSystemFileHandle) {
                            try {
                                console.log(
                                    `text editor: saving ${props.file.path}`
                                );
                                const bytes = new TextEncoder().encode(code());
                                const writable =
                                    await props.file.handle.createWritable();
                                await writable.write(bytes);
                                await writable.close();
                                console.log(
                                    `wrote to ${props.file.path} successfully`
                                );
                            } catch (e) {
                                if (e instanceof Error) {
                                    console.error(
                                        `Failed to save ${props.file.path}: ${e.message}`
                                    );
                                    return;
                                }
                            }
                        }
                    }}
                >
                    Save
                </Button>
            </div>
            <div ref={editorRef} id="codeMirror" />
        </Show>
    );
};
