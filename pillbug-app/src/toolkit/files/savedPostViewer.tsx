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
import { Button } from "pillbug-components/ui/button";
import { OpenedFile } from "./multiFileViewer";
import { PreprocessedPost } from "~/components/post/preprocessed";
import { ProcessedStatus } from "~/components/feed/feed-engine";

export type SavedPostViewerProps = {
    file: OpenedFile;
};

export const SavedPostViewer: Component<SavedPostViewerProps> = (props) => {
    const [postData] = createResource(
        () => {
            return { ...props };
        },
        async (props) => {
            const f = props.file;
            if (f.handle instanceof FileSystemFileHandle) {
                const file = await f.handle.getFile();
                const contents = await file.arrayBuffer();
                const text = new TextDecoder().decode(contents);
                const json = JSON.parse(text);
                return json;
            }
            return undefined;
        }
    );

    return (
        <Show when={!postData.loading && postData()} fallback={`loading`}>
            <PreprocessedPost
                status={postData() as ProcessedStatus}
                limitInitialHeight={true}
            />
        </Show>
    );
};
