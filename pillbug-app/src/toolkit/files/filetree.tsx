import {
    Component,
    createResource,
    createUniqueId,
    For,
    Match,
    Show,
    Switch,
} from "solid-js";
import { StoreBacked } from "~/lib/store-backed";
import { FilesFacetStore } from ".";
import { handler } from "tailwindcss-animate";
import { FaRegularFile, FaRegularFolder, FaSolidFile } from "solid-icons/fa";
import { useSearchParams } from "@solidjs/router";

export type FileTreeProps = {
    opfs?: FileSystemDirectoryHandle;
    facetStore: StoreBacked<FilesFacetStore>;
    path: string[];
};
export const FileTree: Component<FileTreeProps> = (props) => {
    const [fsEntries] = createResource(
        () => {
            return props.opfs!;
        },
        async (opfs: FileSystemDirectoryHandle) => {
            const files = [];
            for await (let e of opfs.entries()) {
                files.push(e);
            }
            return files;
        }
    );

    return (
        <div class="pbInput fileTreeContainer">
            <ul class="fileTree">
                <DirectoryListing
                    opfs={props.opfs}
                    facetStore={props.facetStore}
                    path={[]}
                />
            </ul>
        </div>
    );
};

export const DirectoryListing: Component<FileTreeProps> = (props) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [fsEntries] = createResource(
        () => {
            return props.opfs!;
        },
        async (opfs: FileSystemDirectoryHandle) => {
            const files = [];
            for await (let e of opfs.entries()) {
                files.push(e);
            }
            return files;
        }
    );

    return (
        <For each={fsEntries()}>
            {([fn, handle]) => {
                return (
                    <FileTreeItem
                        handle={handle}
                        selected={false}
                        facetStore={props.facetStore}
                        path={[...props.path, handle.name]}
                        setSelected={() => {
                            props.facetStore.setStore(
                                "currentFile",
                                [...props.path, handle.name].join("/")
                            );
                        }}
                        onDoubleClick={() => {
                            setSearchParams(
                                { path: handle.name },
                                { scroll: true }
                            );
                        }}
                    />
                );
            }}
        </For>
    );
};

const FileTreeItem: Component<{
    handle: FileSystemHandle;
    selected: boolean;
    facetStore: StoreBacked<FilesFacetStore>;
    setSelected: () => void;
    onDoubleClick: () => void;
    path: string[];
}> = (props) => {
    const id = createUniqueId();
    return (
        <li>
            <input
                type="radio"
                id={id}
                name="fileTree"
                value={props.handle.name}
                onChange={(e) => {
                    if (e.currentTarget.checked) props.setSelected();
                }}
            ></input>
            <Switch>
                <Match when={props.handle.kind === "file"}>
                    <label for={id}>
                        <FaRegularFile /> {props.handle.name}
                    </label>
                </Match>
                <Match when={props.handle.kind === "directory"}>
                    <label for={id}>
                        <FaRegularFolder /> {props.handle.name}
                    </label>
                    <ul class="directoryItems">
                        <DirectoryListing
                            opfs={props.handle as FileSystemDirectoryHandle}
                            facetStore={props.facetStore}
                            path={props.path}
                        />
                    </ul>
                </Match>
            </Switch>
        </li>
    );
};
