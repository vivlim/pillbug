import { A } from "@solidjs/router";
import { Status } from "megalodon/lib/src/entities/status";
import { createSignal, Show, type Component } from "solid-js";
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

export type CommentProps = {
    status: Status;
};

export const CommentPostComponent: Component<CommentProps> = (postData) => {
    const status = postData.status;

    const [showingReplyBox, setShowingReplyBox] = createSignal<boolean>(false);
    const [showRaw, setShowRaw] = createSignal<boolean>(false);

    const userHref = `/user/${status.account.acct}`;
    const postHref = `/post/${status.id}`;

    return (
        <>
            <div class="flex flex-row items-center flex-wrap border-b">
                <AvatarLink user={status.account} imgClass="size-6" />
                <A href={userHref} class="font-bold m-2">
                    <HtmlSandboxSpan
                        html={status.account.display_name}
                        emoji={status.account.emojis}
                    />
                </A>
                <A href={userHref} class="m-1 text-neutral-500 text-sm">
                    {status.account.acct}
                </A>
                <A href={postHref} class="m-1 text-neutral-500 text-xs">
                    <Timestamp ts={DateTime.fromISO(status.created_at)} />
                </A>
                <ContextMenu>
                    <ContextMenuTrigger class="flex-auto">
                        {/* it doesn't *really* make sense for this visibility icon to be the right click target... but for now i just need *something* */}
                        <VisibilityIcon
                            class="ml-1 size-3"
                            value={status.visibility}
                        />
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={() => setShowRaw(!showRaw())}>
                            Show raw status
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            </div>
            <div class="md:px-3 pt-2">
                <ContentGuard warnings={status.spoiler_text}>
                    <HtmlSandbox html={status.content} emoji={status.emojis} />
                    <ImageBox
                        attachments={status.media_attachments}
                        sensitive={status.sensitive}
                    />
                </ContentGuard>
            </div>
            <div>
                <button
                    class="border-2 border-transparent hover:border-fuchsia-900 rounded-md p-1 m-1"
                    onClick={() => setShowingReplyBox(!showingReplyBox())}
                >
                    <BsReply class="inline-block mr-1" />
                    reply
                </button>
            </div>
            <Show when={showRaw()}>
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
            <Show when={showingReplyBox()}>
                <div>
                    <NewCommentEditor parentStatus={status} />
                </div>
            </Show>
        </>
    );
};
