import {
    Component,
    createEffect,
    createMemo,
    createResource,
    createUniqueId,
    ErrorBoundary,
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
import { logger } from "~/logging";
import { OpenedFile } from "./multiFileViewer";
import ErrorBox from "~/components/error";
import { Transition } from "solid-transition-group";
import { SavedPostViewer } from "./savedPostViewer";

export type SingleFileViewerProps = {
    opfs?: FileSystemDirectoryHandle;
    path: string;
};

export const SingleFileViewer: Component<SingleFileViewerProps> = (props) => {
    const [openedFile] = createResource(
        () => props.path,
        async (path) => {
            const f = await getFileAtPath(path, props.opfs!, {
                create: false,
            });
            if (f === null) {
                logger.error(`failed to open file ${path}`);
                return;
            }

            return new OpenedFile(f, path);
        }
    );

    const viewer = createMemo(() => {
        const f = openedFile();
        if (f) {
            return mapFileToViewer(f);
        }
    });

    return (
        <ErrorBoundary
            fallback={(e) => (
                <ErrorBox
                    error={e}
                    description={`failed to load ${props.path}`}
                />
            )}
        >
            <Switch>
                <Match when={openedFile.loading}>loading file</Match>
                <Match
                    when={
                        !openedFile.loading &&
                        openedFile !== undefined &&
                        viewer()
                    }
                >
                    <div class="pbCard window pbGlideIn" style="height:100%">
                        <div class="pbPostUserBar titleBar">
                            <div class="title">{openedFile()!.path}</div>
                        </div>
                        <Dynamic component={mapFileToViewer(openedFile()!)} />
                    </div>
                </Match>
            </Switch>
        </ErrorBoundary>
    );
};

function mapFileToViewer(of: OpenedFile): Component {
    if (of.path.endsWith(".post.json")) {
        return () => <SavedPostViewer file={of} />;
    }
    return () => <TextEditor file={of} />;
}
