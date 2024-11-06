import { A, useNavigate } from "@solidjs/router";
import { Entity, MegalodonInterface } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    createEffect,
    createMemo,
    createResource,
    createSignal,
    ErrorBoundary,
    For,
    JSX,
    Match,
    Resource,
    Show,
    splitProps,
    Suspense,
    Switch,
    type Component,
} from "solid-js";
import { SessionAuthManager, useAuth } from "~/auth/auth-manager";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import HtmlSandbox from "../../views/htmlsandbox";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { TextField, TextFieldTextArea } from "~/components/ui/text-field";
import { FaSolidArrowsRotate, FaSolidScrewdriverWrench } from "solid-icons/fa";
import createUrlRegExp from "url-regex-safe";
import { VisibilityIcon } from "~/components/visibility-icon";
import {
    IoChatboxEllipses,
    IoChatboxEllipsesOutline,
    IoEllipsisHorizontal,
    IoHeart,
    IoHeartOutline,
    IoLinkOutline,
    IoShare,
    IoSyncCircle,
    IoSyncOutline,
    IoTrashBinOutline,
} from "solid-icons/io";
import { BsPinAngleFill } from "solid-icons/bs";
import { IconProps } from "solid-icons";
import { cn } from "~/lib/utils";
import { Dynamic } from "solid-js/web";
import { ContentGuard } from "~/components/content-guard";
import { ImageBox } from "~/components/post/image-box";
import { Timestamp } from "~/components/post/timestamp";
import { DateTime } from "luxon";
import { AvatarLink } from "~/components/user/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MenuButton } from "../ui/menubutton";
import { unwrapResponse } from "~/lib/clientUtil";
import { useSettings } from "~/lib/settings-manager";
import { ProcessedStatus } from "../feed/feed-engine";

export type PreprocessedPostProps = {
    class?: string;
    status: ProcessedStatus;
    limitInitialHeight: boolean;
};

export type PreprocessedStatusPostBlockProps = {
    status: ProcessedStatus;
    showRaw: boolean;
    limitInitialHeight: boolean;
};

const PreprocessedPostUserBar: Component<{
    status: Status;
    sharedStatus?: Status | undefined;
}> = (props) => {
    const userHref = `/user/${props.status.account.acct}`;
    const postHref = `/post/${props.status.id}`;
    const status = props.status;
    const shared = props.sharedStatus ?? status.reblog ?? null;

    return (
        <div class="pbPostUserBar border-b flex flex-row flex-wrap items-center gap-x-2 p-2 flex-auto">
            <Show when={status.pinned}>
                <BsPinAngleFill aria-label="Pinned post" class="size-4" />
            </Show>
            <AvatarLink
                user={status.account}
                imgClass="size-8"
                class="inline-block"
            />
            <div class="flex flex-row gap-2 items-center">
                <A href={userHref} class="font-bold whitespace-nowrap">
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
                    class="font-bold whitespace-nowrap"
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

interface PreprocessedPostBodyProps extends JSX.HTMLAttributes<HTMLDivElement> {
    status: Status;
    processedStatus?: ProcessedStatus;
    limitInitialHeight: boolean;
}

const PreprocessedPostBody: Component<PreprocessedPostBodyProps> = (props) => {
    const [, rest] = splitProps(props, ["status", "class"]);
    const settings = useSettings();
    const [heightLimited, setHeightLimited] = createSignal(
        props.limitInitialHeight &&
            !settings.getPersistent().unlimitedPostHeightInFeed
    );
    const [expandButtonVisible, setExpandButtonVisible] =
        createSignal<boolean>(false);
    const [expandButtonClicked, setExpandButtonClicked] =
        createSignal<boolean>(false);

    const [collapser, setCollapser] = createSignal<HTMLDivElement>();
    const [collapsee, setCollapsee] = createSignal<HTMLDivElement>();

    const resizeObserver = new ResizeObserver(() => {
        if (collapser() === undefined || collapsee === undefined) {
            return;
        }

        const currentHeight = collapser()?.offsetHeight;
        const contentHeight = collapsee()?.offsetHeight;
        if (currentHeight === undefined || contentHeight === undefined) {
            return false;
        }
        setExpandButtonVisible(currentHeight < contentHeight);
    });

    createEffect(() => {
        if (!heightLimited()) {
            return;
        }
        const c = collapser();
        if (c !== undefined) {
            resizeObserver.observe(c);
        }
    });
    createEffect(() => {
        if (!heightLimited()) {
            return;
        }
        const c = collapsee();
        if (c !== undefined) {
            resizeObserver.observe(c);
        }
    });

    return (
        <>
            <CardContent class={cn(props.class)} {...rest}>
                <Suspense>
                    <div
                        class={
                            heightLimited() && !expandButtonClicked()
                                ? "pbPostHeightLimiter"
                                : ""
                        }
                        ref={setCollapser}
                    >
                        <div ref={setCollapsee}>
                            <ContentGuard warnings={props.status.spoiler_text}>
                                <div class="p-3">
                                    <HtmlSandbox
                                        html={props.status.content}
                                        emoji={props.status.emojis}
                                    />
                                </div>
                                <ImageBox
                                    attachments={props.status.media_attachments}
                                    sensitive={props.status.sensitive}
                                />
                                <PostPreviewCard
                                    status={props.status}
                                    linkedAncestors={
                                        props.processedStatus?.linkedAncestors
                                    }
                                />
                            </ContentGuard>
                        </div>
                    </div>
                    <Show when={expandButtonVisible() || expandButtonClicked()}>
                        <Button
                            onClick={() =>
                                setExpandButtonClicked(!expandButtonClicked())
                            }
                            class="w-full"
                        >
                            {expandButtonClicked() ? "show less" : "show more"}
                        </Button>
                    </Show>
                </Suspense>
            </CardContent>
        </>
    );
};

const PreprocessedPostFooter: Component<{ children: JSX.Element }> = (
    props
) => {
    return (
        <div class="my-1 mx-3 flex flex-row flex-wrap items-center justify-stretch">
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

type ShareButtonProps = { status: Status };
const ShareButton: Component<ShareButtonProps> = (props) => {
    const navigate = useNavigate();
    const auth = useAuth();
    const [status, setStatus] = createSignal<string>("");
    return (
        <>
            <span>{status()}</span>
            <DropdownMenu>
                <DropdownMenuTrigger as={MenuButton<"button">} type="button">
                    <IoSyncOutline class="size-6" />
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-48">
                    <DropdownMenuItem
                        class="py-4 md:py-2"
                        onClick={async () => {
                            try {
                                setStatus("sharing...");
                                const result =
                                    await auth.assumeSignedIn.client.reblogStatus(
                                        props.status.id
                                    );
                                unwrapResponse(result);
                                setStatus("shared!");
                            } catch (e) {
                                if (e instanceof Error) {
                                    setStatus("error: " + e.message);
                                } else {
                                    setStatus("error");
                                }
                            }
                        }}
                    >
                        <IoSyncOutline class="size-6 mr-2" />
                        quick share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        class="py-4 md:py-2"
                        onClick={() => {
                            navigate(`/share/${props.status.id}`);
                        }}
                    >
                        <IoChatboxEllipsesOutline class="size-6 mr-2" />
                        share in editor
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export const PreprocessedPost: Component<PreprocessedPostProps> = (
    postData
) => {
    const auth = useAuth();
    const settings = useSettings();
    const [status, updateStatus] = createSignal(postData.status.status);

    const [showRaw, setShowRaw] = createSignal<boolean>(false);
    const isLiked = createMemo(() => status().favourited ?? false);

    const userHref = `/user/${status().account.acct}`;
    const postHref = `/post/${status().id}`;

    const postOriginalUrl = createMemo(() => {
        let url = postData.status.status.url;
        if (url === undefined || url === "") {
            url = postData.status.status.uri;
        }

        return url;
    });

    return (
        <div class={cn("pbPostOutside py-1", postData.class)}>
            <ErrorBoundary fallback={(err) => err}>
                <AvatarLink
                    user={status().account}
                    imgClass="size-16"
                    class="outsideAvatar hidden md:block md:m-4"
                />
                <Card class="m-1 md:m-4 flex-auto">
                    <PreprocessedStatusPostBlock
                        status={postData.status}
                        showRaw={showRaw()}
                        limitInitialHeight={postData.limitInitialHeight}
                    ></PreprocessedStatusPostBlock>
                    <PreprocessedPostFooter>
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
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                as={MenuButton<"button">}
                                type="button"
                            >
                                <IoEllipsisHorizontal class="size-6" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent class="w-48">
                                <DropdownMenuItem
                                    class="py-4 md:py-2"
                                    as="a"
                                    href={postOriginalUrl()}
                                    target="_blank"
                                >
                                    <IoLinkOutline class="size-6 mr-2" />
                                    view on origin
                                </DropdownMenuItem>
                                <Show
                                    when={
                                        auth.signedIn &&
                                        status().account.acct ===
                                            auth.assumeSignedIn.state
                                                .accountData.acct
                                    }
                                >
                                    <DropdownMenuItem
                                        class="py-4 md:py-2"
                                        onClick={async () => {
                                            if (
                                                window.confirm(
                                                    "are you sure you want to delete this post?"
                                                )
                                            ) {
                                                try {
                                                    unwrapResponse(
                                                        await auth.assumeSignedIn.client.deleteStatus(
                                                            status().id
                                                        )
                                                    );
                                                    alert(
                                                        "post deleted. (you may need to refresh)"
                                                    );
                                                } catch (e) {
                                                    if (e instanceof Error) {
                                                        alert(
                                                            `Failed to delete: ${e.message}`
                                                        );
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        <IoTrashBinOutline class="size-6 mr-2" />
                                        delete post
                                    </DropdownMenuItem>
                                </Show>
                                <Show
                                    when={
                                        settings.getPersistent().enableDevTools
                                    }
                                >
                                    <DropdownMenuItem
                                        class="py-4 md:py-2"
                                        onClick={() => setShowRaw(!showRaw())}
                                    >
                                        <FaSolidScrewdriverWrench class="size-6 mr-2" />
                                        show post json
                                    </DropdownMenuItem>
                                </Show>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Show when={auth.signedIn}>
                            <ShareButton status={status()} />
                            <Button
                                class="hover:bg-transparent p-0 px-4"
                                aria-label="Like Post"
                                onClick={async () => {
                                    const updated = await toggleLike(
                                        auth.assumeSignedIn.client,
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
                        </Show>
                    </PreprocessedPostFooter>
                </Card>
            </ErrorBoundary>
        </div>
    );
};

const PreprocessedStatusPostBlock: Component<
    PreprocessedStatusPostBlockProps
> = (postData) => {
    const status = postData.status.status;
    const linkedAncestors = createMemo(() =>
        postData.status.linkedAncestors.toReversed()
    );

    return (
        <>
            <Switch>
                <Match when={status.reblog === null}>
                    <Switch>
                        <Match
                            when={postData.status.linkedAncestors.length > 0}
                        >
                            <For each={linkedAncestors()}>
                                {(linkedAncestor, idx) => {
                                    return (
                                        <>
                                            <PreprocessedPostUserBar
                                                status={linkedAncestor.status}
                                                sharedStatus={
                                                    idx() > 0
                                                        ? linkedAncestors()[
                                                              idx() - 1
                                                          ].status
                                                        : undefined
                                                }
                                            />
                                            <PreprocessedPostBody
                                                class="border-b"
                                                status={linkedAncestor.status}
                                                processedStatus={linkedAncestor}
                                                limitInitialHeight={
                                                    postData.limitInitialHeight
                                                }
                                            />
                                            <PostLabels post={linkedAncestor} />
                                        </>
                                    );
                                }}
                            </For>

                            <PreprocessedPostUserBar
                                status={status}
                                sharedStatus={
                                    linkedAncestors().slice(-1)[0].status
                                }
                            />
                            <PreprocessedPostBody
                                class="border-b"
                                status={status}
                                processedStatus={postData.status}
                                limitInitialHeight={postData.limitInitialHeight}
                            />
                            <PostLabels post={postData.status} />
                        </Match>
                        <Match
                            when={postData.status.linkedAncestors.length === 0}
                        >
                            <PreprocessedPostUserBar status={status} />
                            <PreprocessedPostBody
                                class="border-b"
                                status={status}
                                processedStatus={postData.status}
                                limitInitialHeight={postData.limitInitialHeight}
                            />
                            <PostLabels post={postData.status} />
                        </Match>
                    </Switch>
                </Match>
                <Match when={status.reblog !== null}>
                    <PreprocessedPostUserBar status={status} />
                    <PreprocessedPostUserBar status={status.reblog!} />

                    <PreprocessedPostBody
                        class="border-b"
                        status={status.reblog!}
                        limitInitialHeight={postData.limitInitialHeight}
                    />
                    <PostLabels post={postData.status} />
                </Match>
            </Switch>
            <Show when={postData.showRaw}>
                <div class="p-3 border-t">
                    <TextField>
                        <TextFieldTextArea
                            readOnly={true}
                            class="h-[40vh]"
                            value={JSON.stringify(postData.status, null, 2)}
                        ></TextFieldTextArea>
                    </TextField>
                </div>
            </Show>
        </>
    );
};

const PostLabels: Component<{ post: ProcessedStatus }> = (props) => {
    return (
        <For each={props.post.labels}>
            {(label) => <span class="postLabel">{label}</span>}
        </For>
    );
};

export const PostPreviewCard: Component<{
    status: Status;
    linkedAncestors?: ProcessedStatus[];
}> = (props) => {
    const ancestorUrls =
        props.linkedAncestors === undefined
            ? []
            : props.linkedAncestors.map((a) => a.status.url);
    const ancestorContainsUrl =
        ancestorUrls.indexOf(props.status.card?.url) >= 0;
    return (
        <Show when={props.status.card !== null}>
            <Switch>
                <Match when={props.status.card!.type === "link"}>
                    <Show when={!ancestorContainsUrl}>
                        <LinkPreviewCard card={props.status.card!} />
                    </Show>
                </Match>
                <Match when={props.status.card!.type === "video"}>
                    <LinkPreviewCard card={props.status.card!} />
                    (video preview card is not yet implemented)
                </Match>
                <Match when={props.status.card!.type === "photo"}>
                    <Show when={useSettings().getPersistent().enableDevTools}>
                        (dev msg: there would be a photo preview card here. is
                        that expected?)
                    </Show>
                </Match>
                <Match when={props.status.card!.type === "rich"}>
                    <LinkPreviewCard card={props.status.card!} />
                    (rich card is not yet implemented)
                </Match>
            </Switch>
        </Show>
    );
};
const LinkPreviewCard: Component<{ card: Entity.Card }> = (props) => {
    return (
        <a href={props.card.url} target="_blank">
            <Card class="linkPreview m-2">
                <CardHeader>
                    <CardTitle>{props.card.title}</CardTitle>
                </CardHeader>
                <CardContent class="mx-4">
                    <div>{props.card.url}</div>
                    <CardDescription>{props.card.description}</CardDescription>
                    <Show when={props.card.image !== null}>
                        <img src={props.card.image!} class="size-16" />
                    </Show>
                </CardContent>
                <CardFooter></CardFooter>
            </Card>
        </a>
    );
};