import {
    Component,
    createMemo,
    createSignal,
    ErrorBoundary,
    For,
    Match,
    Switch,
} from "solid-js";
import { CommentPostComponent } from "~/views/comment";
import {
    PostTreeStatusNode,
    IPostTreeNode,
    PostTreePlaceholderNode,
    usePostPageContext,
} from "~/views/postpage";
import { Card } from "../ui/card";
import { useAuth } from "~/auth/auth-manager";
import { Entity, MegalodonInterface } from "megalodon";
import { isValidVisibility, PostOptions } from "~/views/editdialog";
import { IoWarningOutline } from "solid-icons/io";
import {
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenu,
} from "../ui/dropdown-menu";
import { TextFieldTextArea, TextFieldInput, TextField } from "../ui/text-field";
import { VisibilityIcon } from "../visibility-icon";
import { MenuButton } from "../ui/menubutton";
import { Button } from "../ui/button";
import { Status } from "megalodon/lib/src/entities/status";

/** A root comment appearing underneath a post. */
export const Comment: Component<{ node: IPostTreeNode }> = (props) => {
    return (
        <ErrorBoundary fallback={(err) => err}>
            <Card class="my-1 py-4 px-4 md:mr-4 md:ml-20">
                <div>
                    <Switch>
                        <Match when={props.node instanceof PostTreeStatusNode}>
                            <CommentPostComponent
                                status={
                                    (props.node as PostTreeStatusNode).status
                                }
                            />
                        </Match>
                        <Match
                            when={props.node instanceof PostTreePlaceholderNode}
                        >
                            <Card class="m-4 flex flex-row mx-20 my-1 py-1">
                                {
                                    (props.node as PostTreePlaceholderNode)
                                        .message
                                }
                            </Card>
                        </Match>
                    </Switch>
                </div>
                <div class="ml-4 md:ml-8 border-l pl-4 pr-4">
                    <For each={props.node.children}>
                        {(node, index) => <NestedComment node={node} />}
                    </For>
                </div>
            </Card>
        </ErrorBoundary>
    );
};

/** A nested comment that is within a root comment. */
const NestedComment: Component<{ node: IPostTreeNode }> = (props) => {
    return (
        <ErrorBoundary fallback={(err) => err}>
            <Switch>
                <Match when={props.node instanceof PostTreeStatusNode}>
                    <CommentPostComponent
                        status={(props.node as PostTreeStatusNode).status}
                    />
                </Match>
                <Match when={props.node instanceof PostTreePlaceholderNode}>
                    <Card class="m-4 flex flex-row mx-20 my-1 py-1">
                        {(props.node as PostTreePlaceholderNode).message}
                    </Card>
                </Match>
            </Switch>
            <div class="ml-4">
                <For each={props.node.children}>
                    {(node, index) => <NestedComment node={node} />}
                </For>
            </div>
        </ErrorBoundary>
    );
};

export interface NewCommentEditorProps {
    parentStatus: Status;
}

export const NewCommentEditor: Component<NewCommentEditorProps> = (props) => {
    const auth = useAuth();
    const postPageContext = usePostPageContext();

    const [posted, setPosted] = createSignal(false);
    const [postId, setPostId] = createSignal<string | null>(null);

    const [busy, setBusy] = createSignal(false);
    const [cwVisible, setCwVisible] = createSignal(
        props.parentStatus.spoiler_text ? true : false
    );
    const [rawCwContent, setCwContent] = createSignal(
        props.parentStatus.spoiler_text
    );
    /// Gets the content warning in a way that can be transferred to Megalodon
    const cwContent = createMemo(() => {
        if (cwVisible()) {
            const rawCw = rawCwContent().trim();
            return rawCw == "" ? null : rawCw;
        } else {
            return null;
        }
    });
    // TODO: meaningfully hook this up
    const [postErrors, setErrors] = createSignal<Array<string>>([]);
    const pushError = (error: string) => {
        const errors = postErrors();
        errors.push(error);
        setErrors(errors);
    };
    const hasErrors = createMemo(() => postErrors().length > 0);
    const [status, setStatus] = createSignal(
        `@${props.parentStatus.account.acct} `
    );
    const [visibility, setVisibility] = createSignal<Entity.StatusVisibility>(
        props.parentStatus.visibility
    );

    // Submits the post. Returns the post ID, or null if an error occurred
    const sendPost = async (
        client: MegalodonInterface
    ): Promise<string | null> => {
        const imminentStatus = status().trim();
        if (imminentStatus.length == 0) {
            pushError("No status provided");
            return null;
        }
        const cw = cwContent();

        let options: PostOptions = {
            visibility: visibility(),
            sensitive: cw != null,
            /* @ts-expect-error: 'string | null' */
            spoiler_text: cw,
            in_reply_to_id: props.parentStatus.id,
        };
        console.log(
            `new comment with post options: ${JSON.stringify(options)}`
        );
        try {
            const status = await client.postStatus(imminentStatus, options);
            return status.data.id;
        } catch (ex) {
            if (ex != null) {
                pushError(ex.toString());
                return null;
            } else {
                pushError("Unknown error while trying to post");
                return null;
            }
        }
    };

    return (
        <form
            onsubmit={async (ev) => {
                ev.preventDefault();
                if (!auth.signedIn) {
                    pushError("Can't post if you're not logged in!");
                    return;
                }

                setBusy(true);
                const client = await auth.assumeSignedIn.client;
                const post_id = await sendPost(client);
                if (post_id) {
                    setPostId(post_id);
                    setPosted(true);
                    // Reset the form
                    ev.currentTarget.form?.reset();
                    setBusy(false);

                    // reload the post
                    console.log("attempting to reload post to get new comment");
                    const [loadProps, setLoadProps] = postPageContext.loadProps;
                    // bump the last refresh time to trigger reload.
                    setLoadProps({
                        postId: loadProps().postId,
                        lastRefresh: Date.now(),
                        newCommentId: post_id,
                    });
                } else {
                    // TODO: show errors
                    console.error(postErrors().join("\n"));
                }
                return false;
            }}
        >
            <div class="flex flex-col gap-3">
                <TextField class="border-none w-full flex-grow py-0 items-start justify-between">
                    <TextFieldTextArea
                        tabindex="0"
                        placeholder="leave a comment..."
                        class="resize-none overflow-hidden px-3 py-2 text-md border-2 rounded-md"
                        disabled={busy()}
                        onInput={(e) => {
                            setStatus(e.currentTarget.value);
                        }}
                        value={status()}
                    ></TextFieldTextArea>
                </TextField>
                <TextField
                    class="border-none w-full flex-shrink"
                    hidden={!cwVisible()}
                >
                    <TextFieldInput
                        type="text"
                        class="resize-none px-3 py-2 text-sm border-2 rounded-md focus-visible:ring-0"
                        placeholder="content warnings"
                        disabled={busy()}
                        onInput={(e) => {
                            setCwContent(e.currentTarget.value);
                        }}
                        value={cwContent() ?? undefined}
                    ></TextFieldInput>
                </TextField>
            </div>
            <div>
                <div class="flex-grow flex flex-row gap-2">
                    <MenuButton
                        onClick={() => {
                            setCwVisible(!cwVisible());
                        }}
                    >
                        <IoWarningOutline class="size-5" />
                    </MenuButton>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            as={MenuButton<"button">}
                            type="button"
                        >
                            <VisibilityIcon
                                value={visibility()}
                                class="size-4"
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent class="w-48">
                            <DropdownMenuRadioGroup
                                value={visibility()}
                                onChange={(val) => {
                                    if (isValidVisibility(val)) {
                                        setVisibility(val);
                                    } // TODO: ignore it for now, but otherwise uh, explode or something
                                }}
                            >
                                <DropdownMenuRadioItem value="unlisted">
                                    Unlisted
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="private">
                                    Private
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="direct">
                                    Mentioned Only
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div class="flex-1" />
                    <Button type="submit" disabled={busy()}>
                        Post
                    </Button>
                </div>
            </div>
        </form>
    );
};