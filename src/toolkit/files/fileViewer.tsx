import {
    Component,
    createEffect,
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
import { Button } from "~/components/ui/button";
import { logger } from "~/logging";
import { OpenedFile } from "./multiFileViewer";
import ErrorBox from "~/components/error";
import { Transition } from "solid-transition-group";

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
                <Match when={!openedFile.loading && openedFile !== undefined}>
                    <div class="pbCard window pbGlideIn" style="height:100%">
                        <div class="pbPostUserBar titleBar">
                            <div class="title">{openedFile()!.path}</div>
                        </div>
                        <TextEditor file={openedFile()!} />
                    </div>
                </Match>
            </Switch>
        </ErrorBoundary>
    );
};
