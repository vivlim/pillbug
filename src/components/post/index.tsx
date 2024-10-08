import { A } from "@solidjs/router";
import { Entity, MegalodonInterface } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    createMemo,
    createResource,
    createSignal,
    ErrorBoundary,
    JSX,
    Match,
    Resource,
    Show,
    splitProps,
    Switch,
    type Component,
} from "solid-js";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import HtmlSandbox from "../../views/htmlsandbox";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { TextField, TextFieldTextArea } from "~/components/ui/text-field";
import { FaSolidArrowsRotate } from "solid-icons/fa";
import createUrlRegExp from "url-regex-safe";
import { VisibilityIcon } from "~/components/visibility-icon";
import { IoHeart, IoHeartOutline } from "solid-icons/io";
import { IconProps } from "solid-icons";
import { cn } from "~/lib/utils";
import { Dynamic } from "solid-js/web";
import { ContentGuard } from "~/components/content-guard";
import { ImageBox } from "~/components/post/image-box";
import { Timestamp } from "~/components/post/timestamp";
import { DateTime } from "luxon";
import { AvatarLink } from "~/components/user/avatar";

export type PostWithSharedProps = {
    status: Status;
    showRaw: boolean;
    fetchShareParent: boolean;
    shareParentUrl?: string | null;
};

export type PostProps = {
    class?: string;
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
        <div class="border-b flex flex-row flex-wrap items-center gap-x-2 p-2 flex-auto">
            <AvatarLink
                user={status.account}
                imgClass="size-8"
                class="inline-block"
            />
            <div class="flex flex-row gap-2 items-center">
                <A href={userHref} class="whitespace-nowrap">
                    {status.account.display_name}
                </A>
                <VisibilityIcon class="size-4" value={status.visibility} />
            </div>
            <A href={userHref} class="text-neutral-500">
                {status.account.acct}
            </A>
            <A href={postHref} class="text-neutral-500 text-xs">
                <Timestamp ts={DateTime.fromISO(status.created_at)} />
            </A>
            <Show when={shared !== null}>
                <FaSolidArrowsRotate />
                <A
                    href={`/user/${shared!.account.acct}`}
                    class="whitespace-nowrap"
                >
                    {shared!.account.display_name}
                </A>
                <A
                    href={`/user/${shared!.account.acct}`}
                    class="text-neutral-500 whitespace-nowrap"
                >
                    {shared!.account.acct}
                </A>
            </Show>
        </div>
    );
};

interface PostBodyProps extends JSX.HTMLAttributes<HTMLDivElement> {
    status: Status;
}

const PostBody: Component<PostBodyProps> = (props) => {
    const [, rest] = splitProps(props, ["status", "class"]);
    return (
        <CardContent class={cn("p-3", props.class)} {...rest}>
            <ContentGuard warnings={props.status.spoiler_text}>
                <ImageBox attachments={props.status.media_attachments} />
                <HtmlSandbox html={props.status.content} />
            </ContentGuard>
        </CardContent>
    );
};

const PostFooter: Component<{ children: JSX.Element }> = (props) => {
    return (
        <div class="my-1 mx-2 flex flex-row flex-wrap items-center justify-stretch">
            {props.children}
        </div>
    );
};

function favButton(isLiked: boolean): Component<IconProps> {
    if (isLiked) {
        return (props) => {
            const [, rest] = splitProps(props, ["class"]);
            return (
                <IoHeart class={cn("text-red-500", props.class)} {...rest} />
            );
        };
    } else {
        return (props) => {
            return <IoHeartOutline {...props} />;
        };
    }
}

async function toggleLike(
    client: MegalodonInterface,
    status: Status
): Promise<Status> {
    let res;
    if (status.favourited) {
        res = await client.unfavouriteStatus(status.id);
    } else {
        res = await client.favouriteStatus(status.id);
    }

    if (res.status != 200) {
        throw new Error(res.statusText);
    }

    return res.data;
}

const Post: Component<PostProps> = (postData) => {
    const authContext = useAuthContext();
    const [status, updateStatus] = createSignal(postData.status);

    const [showRaw, setShowRaw] = createSignal<boolean>(false);
    const isLiked = createMemo(() => status().favourited ?? false);

    const userHref = `/user/${status().account.acct}`;
    const postHref = `/post/${status().id}`;

    return (
        <div class={cn("flex flex-row flex-auto md:px-8 py-1", postData.class)}>
            <ErrorBoundary fallback={(err) => err}>
                <AvatarLink
                    user={status().account}
                    imgClass="size-16"
                    class="hidden md:block md:m-4"
                />
                <Card class="m-1 md:m-4 flex-auto">
                    <PostWithShared
                        status={postData.status}
                        fetchShareParent={postData.fetchShareParent}
                        showRaw={showRaw()}
                    />
                    <PostFooter>
                        <ContextMenu>
                            <ContextMenuTrigger class="flex-auto">
                                <A href={postHref}>
                                    {status().replies_count} replies
                                </A>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem
                                    onClick={() => setShowRaw(!showRaw())}
                                >
                                    Show raw status
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                        <Button
                            variant="ghost"
                            class="hover:bg-transparent p-0"
                            aria-label="Like Post"
                            onClick={async () => {
                                if (!authContext.authState.signedIn) {
                                    throw new Error("Not logged in");
                                }

                                const client =
                                    authContext.authState.signedIn
                                        .authenticatedClient;

                                const updated = await toggleLike(
                                    client,
                                    status()
                                );
                                updateStatus(updated);
                            }}
                        >
                            <Dynamic
                                component={favButton(isLiked())}
                                class="size-6"
                            />
                        </Button>
                    </PostFooter>
                </Card>
            </ErrorBoundary>
        </div>
    );
};

const StatusPostBlock: Component<StatusPostBlockProps> = (postData) => {
    const status = postData.status;

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
                            <PostBody class="border-b" status={status} />
                        </Match>
                        <Match
                            when={
                                postData.shareParent === undefined ||
                                (postData.shareParent !== undefined &&
                                    postData.shareParent() === undefined)
                            }
                        >
                            <PostUserBar status={status} />
                            <PostBody class="border-b" status={status} />
                        </Match>
                    </Switch>
                </Match>
                <Match when={status.reblog !== null}>
                    <PostUserBar status={status} />
                    <PostUserBar status={status.reblog!} />

                    <PostBody class="border-b" status={status.reblog!} />
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
