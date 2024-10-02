import { A } from "@solidjs/router";
import { Entity } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    createResource,
    createSignal,
    ErrorBoundary,
    For,
    Match,
    Resource,
    Setter,
    Show,
    Switch,
    type Component,
} from "solid-js";
import { tryGetAuthenticatedClient } from "~/App";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import HtmlSandbox from "./htmlsandbox";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { TextField, TextFieldTextArea } from "~/components/ui/text-field";
import { FaSolidArrowsRotate } from "solid-icons/fa";
import createUrlRegExp from "url-regex-safe";

export type PostWithSharedProps = {
    status: Status;
    showRaw: boolean;
    fetchShareParent: boolean;
    shareParentUrl?: string | null;
};

export type PostProps = {
    status: Status;
    fetchShareParent: boolean;
    shareParent?: Resource<Status | undefined> | undefined;
};

export type StatusPostBlockProps = {
    status: Status;
    showRaw: boolean;
    fetchShareParent: boolean;
    shareParent?: Resource<Status | undefined> | undefined;
};

export async function fetchShareParentPost(
    authContext: AuthProviderProps,
    postUrl: string
): Promise<Status | null> {
    if (!authContext.authState.signedIn) {
        return null;
    }

    console.log(`fetching parent post ${postUrl}`);
    const client = authContext.authState.signedIn.authenticatedClient;
    const result = await client.search(postUrl, { type: "statuses", limit: 1 });
    if (result.status !== 200) {
        throw new Error(`Failed to get shared post: ${result.statusText}`);
    }
    if (result.data.statuses.length === 0) {
        return null;
    }
    return result.data.statuses[0];
}

const urlRegex = createUrlRegExp({
    strict: true,
    localhost: false,
});
export function getShareParentUrl(status: Status): string | undefined {
    let urls = status.content.match(urlRegex);
    if (urls === null) {
        return undefined;
    }
    return urls.find((u) => u.match(/statuses/)) ?? undefined;
}

const PostUserBar: Component<{
    status: Status;
    sharedStatus?: Status | undefined;
}> = (props) => {
    const userHref = `/user/${props.status.account.acct}`;
    const postHref = `/post/${props.status.id}`;
    const status = props.status;
    const shared = props.sharedStatus ?? status.reblog ?? null;

    return (
        <div class="border-b flex flex-row items-center gap-4 p-2">
            <img
                src={status.account.avatar}
                class="aspect-square h-8 inline"
                alt={`the avatar of ${status.account.acct}`}
            />
            <A href={userHref} class="whitespace-nowrap">
                {status.account.display_name}
            </A>
            <A href={userHref} class="text-neutral-500">
                {status.account.acct}
            </A>
            <A href={postHref} class="text-neutral-500">
                {status.created_at}
            </A>
            <Show when={shared !== null}>
                <FaSolidArrowsRotate class="m-1" />
                <A
                    href={`/user/${shared!.account.acct}`}
                    class="m-2 whitespace-nowrap"
                >
                    {shared!.account.display_name}
                </A>
                <A
                    href={`/user/${shared!.account.acct}`}
                    class="m-1 text-neutral-500 whitespace-nowrap"
                >
                    {shared!.account.acct}
                </A>
            </Show>
        </div>
    );
};

const Post: Component<PostProps> = (postData) => {
    const status = postData.status;

    const [showRaw, setShowRaw] = createSignal<boolean>(false);

    const userHref = `/user/${status.account.acct}`;
    const postHref = `/post/${status.id}`;

    return (
        <div class="flex flex-row px-8 py-1">
            <ErrorBoundary fallback={(err) => err}>
                <div class="w-16 flex-none">
                    <A href={userHref} class="m-2 size-16 aspect-square">
                        <img
                            src={status.account.avatar}
                            class="aspect-square"
                            alt={`the avatar of ${status.account.acct}`}
                        />
                    </A>
                </div>
                <Card class="m-4 flex-1 grow ">
                    <PostWithShared
                        status={postData.status}
                        fetchShareParent={postData.fetchShareParent}
                        showRaw={showRaw()}
                    />
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div class="p-3 border-t">
                                <A href={postHref}>
                                    {status.replies_count} replies
                                </A>
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem
                                onClick={() => setShowRaw(!showRaw())}
                            >
                                Show raw status
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                </Card>
            </ErrorBoundary>
        </div>
    );
};

const StatusPostBlock: Component<StatusPostBlockProps> = (postData) => {
    const status = postData.status;

    const [showRaw, setShowRaw] = createSignal<boolean>(false);

    return (
        <>
            <Switch>
                <Match when={status.reblog === null}>
                    <Switch>
                        <Match when={postData.shareParent?.loading}>
                            <div>fetching shared post...</div>
                        </Match>
                        <Match
                            when={
                                postData.shareParent !== undefined &&
                                postData.shareParent() !== undefined
                            }
                        >
                            <PostWithShared
                                status={postData.shareParent!() as Status}
                                showRaw={postData.showRaw}
                                fetchShareParent={postData.fetchShareParent}
                            />
                            <PostUserBar
                                status={status}
                                sharedStatus={postData.shareParent!()}
                            />
                            <CardContent class="p-3 border-b">
                                <HtmlSandbox html={status.content} />
                            </CardContent>
                        </Match>
                        <Match
                            when={
                                postData.shareParent === undefined ||
                                (postData.shareParent !== undefined &&
                                    postData.shareParent() === undefined)
                            }
                        >
                            <PostUserBar status={status} />
                            <CardContent class="p-3 border-b">
                                <HtmlSandbox html={status.content} />
                            </CardContent>
                        </Match>
                    </Switch>
                </Match>
                <Match when={status.reblog !== null}>
                    <PostUserBar status={status} />
                    <PostUserBar status={status.reblog!} />

                    <CardContent class="p-3 border-b">
                        <HtmlSandbox html={status.reblog!.content} />
                    </CardContent>
                </Match>
            </Switch>
            <Show when={postData.showRaw}>
                <div class="p-3 border-t">
                    <TextField>
                        <TextFieldTextArea
                            readOnly={true}
                            class="h-[40vh]"
                            value={JSON.stringify(status, null, 2)}
                        ></TextFieldTextArea>
                    </TextField>
                </div>
            </Show>
        </>
    );
};

export const PostWithShared: Component<PostWithSharedProps> = (postData) => {
    const authContext = useAuthContext();
    const [parentPostUrl, setParentPostUrl] = createSignal<string | null>(
        postData.shareParentUrl ?? null
    );
    const [shareParentPost] = createResource(parentPostUrl, (pp) => {
        return fetchShareParentPost(authContext, pp);
    });
    if (postData.shareParentUrl === undefined) {
        const sharedUrl = getShareParentUrl(postData.status);
        if (sharedUrl !== undefined) {
            setParentPostUrl(sharedUrl);
        }
    }
    return (
        <StatusPostBlock
            status={postData.status}
            /* @ts-expect-error: 'Status | null' */
            shareParent={shareParentPost}
            showRaw={postData.showRaw}
        ></StatusPostBlock>
    );
};

export default Post;
