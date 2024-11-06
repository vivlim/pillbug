import { Component, createMemo, createResource, Show } from "solid-js";
import {
    createCodeMirror,
    createCompartmentExtension,
    createEditorControlledValue,
    createEditorReadonly,
} from "solid-codemirror";
import { createSignal, onMount } from "solid-js";
import { StoreBacked } from "~/lib/store-backed";
import { FilesFacetStore } from ".";
import { EditorState, Transaction } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { indentWithTab } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import { getFileAtPath } from "./opfs";
import { Button } from "~/components/ui/button";
import { BeforeLeaveEventArgs, useBeforeLeave } from "@solidjs/router";
import { OpenedFile } from "./multiFileViewer";

export type TextEditorProps = {
    file: OpenedFile;
};
export const TextEditor: Component<TextEditorProps> = (props) => {
    const [code, setCode] = createSignal("loading");
    const [lastSavedCode, setLastSavedCode] = createSignal("");
    const {
        editorView,
        ref: editorRef,
        createExtension,
    } = createCodeMirror({
        /**
         * The initial value of the editor
         */
        value: "loading",
        /**
         * Fired whenever the editor code value changes.
         */
        onValueChange: setCode,
        /**
         * Fired whenever a change occurs to the document, every time the view updates.
         */
        onModelViewUpdate: (modelView) => {},
        // console.log("modelView updated", modelView),
        /**
         * Fired whenever a transaction has been dispatched to the view.
         * Used to add external behavior to the transaction [dispatch function](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) for this editor view, which is the way updates get routed to the view
         */
        onTransactionDispatched: (tr: Transaction, view: EditorView) => {},
        // console.log("Transaction", tr),
    });

    const theme = EditorView.theme({
        "&": {
            background: "red",
        },
    });
    createExtension(basicSetup);
    createExtension(keymap.of([indentWithTab]));
    createExtension(javascript());
    createExtension(EditorView.lineWrapping);

    const [readOnly, setReadOnly] = createSignal(false);
    createEditorReadonly(editorView, readOnly);
    createEditorControlledValue(editorView, code);

    const [fetchFileContents, fetchAction] = createResource(
        () => props.file,
        async (f) => {
            if (f.handle instanceof FileSystemFileHandle) {
                const file = await f.handle.getFile();
                const contents = await file.arrayBuffer();
                const text = new TextDecoder().decode(contents);

                setCode(text);
                setLastSavedCode(text);
                setReadOnly(false);
                //args.editorView.setState(EditorState.create({ doc: text }));
                return text;
            } else {
                console.log(`handle is not a file handle for ${f.path}`);
            }
        }
    );

    const hasUnsavedChanges = createMemo(() => {
        return code() !== lastSavedCode();
    });

    useBeforeLeave((e: BeforeLeaveEventArgs) => {
        if (hasUnsavedChanges()) {
            if (!e.defaultPrevented) {
                e.preventDefault();
                if (window.confirm("Abandon unsaved changes?")) {
                    e.retry(true);
                }
            }
        }
    });

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
                                setLastSavedCode(code());
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
                    disabled={!hasUnsavedChanges()}
                >
                    Save changes
                </Button>
            </div>
            <div ref={editorRef} id="codeMirror" />
        </Show>
    );
};
