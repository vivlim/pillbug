import { Component, createResource, Show } from "solid-js";
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

export type TextEditorProps = {
    facetStore: StoreBacked<FilesFacetStore>;
};
export const TextEditor: Component<TextEditorProps> = (props) => {
    const [code, setCode] = createSignal("loading");
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
        onModelViewUpdate: (modelView) =>
            console.log("modelView updated", modelView),
        /**
         * Fired whenever a transaction has been dispatched to the view.
         * Used to add external behavior to the transaction [dispatch function](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) for this editor view, which is the way updates get routed to the view
         */
        onTransactionDispatched: (tr: Transaction, view: EditorView) =>
            console.log("Transaction", tr),
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

    const [readOnly, setReadOnly] = createSignal(true);
    createEditorReadonly(editorView, readOnly);
    createEditorControlledValue(editorView, code);

    const [fetchFileContents, fetchAction] = createResource(
        () => props.facetStore.store.currentFile,
        async (fn) => {
            const fs = await navigator.storage.getDirectory();
            const f = await getFileAtPath(fn, fs, { create: false });
            const file = await f!.getFile();
            const contents = await file.arrayBuffer();
            const text = new TextDecoder().decode(contents);

            setCode(text);
            setReadOnly(false);
            //args.editorView.setState(EditorState.create({ doc: text }));
            return text;
        }
    );

    return (
        <div class="pbCard window" style="height:100%">
            <Show when={!fetchFileContents.loading} fallback="reading file">
                <div class="pbPostUserBar">
                    {props.facetStore.store.currentFile ?? "undefined"}
                </div>
                <div ref={editorRef} id="codeMirror" />
            </Show>
        </div>
    );
};
