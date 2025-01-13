import { useSearchParams } from "@solidjs/router";
import { Account } from "megalodon/lib/src/entities/account";
import { Tag } from "megalodon/lib/src/entities/tag";
import { Hashtag } from "megalodon/lib/src/firefish/entities/hashtag";
import {
    Component,
    For,
    Match,
    Show,
    Switch,
    createEffect,
    createResource,
    createSignal,
    onCleanup,
    onMount,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import {
    PreprocessedPost,
    wrapUnprocessedStatus,
} from "~/components/post/preprocessed";
import { EnterToSubmitShortcut, Textbox } from "~/components/textbox";
import { Button } from "pillbug-components/ui/button";
import { AvatarImage, AvatarLink } from "~/components/user/avatar";
import { unwrapResponse } from "~/lib/clientUtil";
import { StoreBacked } from "~/lib/store-backed";
import { useFrameContext } from "~/components/frame/context";
import { LayoutLeftColumnPortal } from "~/components/layout/columns";
import { FileTree } from "~/toolkit/files/filetree";
import {
    createFileAtPromptedPath,
    deleteFileAtPath,
} from "~/toolkit/files/opfs";
import { FilesFacetStore } from "~/toolkit/files";

export const LinkHistoryFacet: Component = () => {
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
        createResource<FileSystemDirectoryHandle>(async () => {
            const root = await navigator.storage.getDirectory();
            const history = await root.getDirectoryHandle("history", {
                create: true,
            });
            return await root.getDirectoryHandle("links", { create: true });
        });

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
                            path={["/"]}
                        ></FileTree>
                    </div>
                </LayoutLeftColumnPortal>
            </Show>
        </div>
    );
};
