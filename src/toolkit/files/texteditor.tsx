import { Component } from "solid-js";
import { StoreBacked } from "~/lib/store-backed";
import { FilesFacetStore } from ".";

export type TextEditorProps = {
    facetStore: StoreBacked<FilesFacetStore>;
};
export const TextEditor: Component<TextEditorProps> = (props) => {
    return (
        <div class="pbCard" style="height:100%">
            the current file is:{" "}
            {props.facetStore.store.currentFile ?? "undefined"}
        </div>
    );
};
