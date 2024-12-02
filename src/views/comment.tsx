import { A } from "@solidjs/router";
import { Status } from "megalodon/lib/src/entities/status";
import {
    createMemo,
    createSignal,
    Show,
    splitProps,
    type Component,
} from "solid-js";
import HtmlSandbox, { HtmlSandboxSpan } from "./htmlsandbox";
import { Timestamp } from "~/components/post/timestamp";
import { DateTime } from "luxon";
import { AvatarLink } from "~/components/user/avatar";
import { BsReply } from "solid-icons/bs";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { TextField, TextFieldTextArea } from "~/components/ui/text-field";
import { VisibilityIcon } from "~/components/visibility-icon";
import { ContentGuard } from "~/components/content-guard";
import { ImageBox } from "~/components/post/image-box";
import { NewCommentEditor } from "~/components/editor/comments";
import { IconProps } from "solid-icons";
import { cn } from "~/lib/utils";
import {
    IoEllipsisHorizontal,
    IoHeart,
    IoHeartOutline,
    IoLinkOutline,
    IoTrashBinOutline,
} from "solid-icons/io";
import { MegalodonInterface } from "megalodon";
import { useAuth } from "~/auth/auth-manager";
import { useSettings } from "~/lib/settings-manager";
import { Dynamic } from "solid-js/web";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FaSolidScrewdriverWrench } from "solid-icons/fa";
import { MenuButton } from "~/components/ui/menubutton";
import { unwrapResponse } from "~/lib/clientUtil";
import { UserContextMenu } from "~/components/post-embedded/user-link";
export type CommentProps = {
    status: Status;
};

export const CommentPostComponent: Component<CommentProps> = (postData) => {
    const [status, updateStatus] = createSignal(postData.status);
    const isLiked = createMemo(() => status().favourited ?? false);
    const auth = useAuth();
    const settings = useSettings();

    const [showingReplyBox, setShowingReplyBox] = createSignal<boolean>(false);
    const [showRaw, setShowRaw] = createSignal<boolean>(false);

    const userHref = createMemo(() => `/user/${status().account.acct}`);
    const postHref = createMemo(() => `/post/${status().id}`);

    const postOriginalUrl = createMemo(() => {
        let url = postData.status.url;
        if (url === undefined || url === "") {
            url = postData.status.uri;
        }

        return url;
    });

    return (
        <>
            <div class="flex flex-row items-center flex-wrap border-b">
                <UserContextMenu
                    account={status().account}
                    href={status().account.url}
                >
                    <ContextMenuTrigger class="flex flex-row items-center gap-x-2 select-none">
                        <AvatarLink user={status().account} imgClass="size-6" />
                        <A href={userHref()} class="font-bold m-2">
                            <HtmlSandboxSpan
                                html={status().account.display_name}
                                emoji={status().account.emojis}
                            />
                        </A>
                        <A href={userHref()} class="m-1 pbSubtleText text-sm">
                            {status().account.acct}
                        </A>
                        <A href={postHref()} class="m-1 pbSubtleText text-xs">
                            <Timestamp
                                ts={DateTime.fromISO(status().created_at)}
                            />
                        </A>
                    </ContextMenuTrigger>
                </UserContextMenu>
            </div>
            <div class="md:px-3 pt-2">
                <ContentGuard warnings={status().spoiler_text}>
                    <HtmlSandbox
                        html={status().content}
                        emoji={status().emojis}
                    />
                    <ImageBox
                        attachments={status().media_attachments}
                        sensitive={status().sensitive}
                    />
                </ContentGuard>
            </div>
            <div>
                <Show when={auth.signedIn}>
                    <button
                        class="pbButtonPrimary p-1 m-1"
                        onClick={() => setShowingReplyBox(!showingReplyBox())}
                    >
                        <BsReply class="inline-block mr-1" />
                        reply
                    </button>

                    <button
                        class="pbButtonPrimary  p-1 m-1"
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
                            class="inline-block mx-1"
                        />
                    </button>
                </Show>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        as={"button"}
                        type="button"
                        class="pbButtonPrimary p-1 m-1"
                    >
                        <IoEllipsisHorizontal class="inline-block mx-1" />
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
                                postData.status.account.acct ===
                                    auth.assumeSignedIn.state.accountData.acct
                            }
                        >
                            <DropdownMenuItem
                                class="py-4 md:py-2"
                                onClick={async () => {
                                    if (
                                        window.confirm(
                                            "are you sure you want to delete this comment?"
                                        )
                                    ) {
                                        try {
                                            unwrapResponse(
                                                await auth.assumeSignedIn.client.deleteStatus(
                                                    postData.status.id
                                                )
                                            );
                                            alert(
                                                "comment deleted. (you may need to refresh)"
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
                                delete comment
                            </DropdownMenuItem>
                        </Show>
                        <Show when={settings.getPersistent().enableDevTools}>
                            <DropdownMenuItem
                                class="py-4 md:py-2"
                                onClick={() => setShowRaw(!showRaw())}
                            >
                                <FaSolidScrewdriverWrench class="size-6 mr-2" />
                                show comment json
                            </DropdownMenuItem>
                        </Show>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Show when={showRaw()}>
                <div class="p-3 border-t">
                    <TextField>
                        <TextFieldTextArea
                            readOnly={true}
                            class="h-[40vh]"
                            value={JSON.stringify(status(), null, 2)}
                        ></TextFieldTextArea>
                    </TextField>
                </div>
            </Show>
            <Show when={showingReplyBox()}>
                <div>
                    <NewCommentEditor parentStatus={status()} />
                </div>
            </Show>
        </>
    );
};

// these are just copied roughly from post atm
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