import { useNavigate } from "@solidjs/router";
import { Entity, MegalodonInterface } from "megalodon";
import {
    createEffect,
    createMemo,
    createSignal,
    splitProps,
    ValidComponent,
    type Component,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import { Button, ButtonProps } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import {
    TextFieldLabel,
    TextFieldInput,
    TextField,
    TextFieldTextArea,
} from "~/components/ui/text-field";
import { DialogRootProps } from "@kobalte/core/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PolymorphicProps } from "@kobalte/core/polymorphic";
import { cn } from "~/lib/utils";
import { useEditOverlayContext } from "~/lib/edit-overlay-context";
import { VisibilityIcon } from "~/components/visibility-icon";
import { IoWarningOutline } from "solid-icons/io";
import { MenuButton } from "~/components/ui/menubutton";

export interface EditDialogProps extends DialogRootProps {
    returnRoute?: string;
    onSubmit?: (new_id: string) => void;
}

export interface PostOptions {
    media_ids?: Array<string>;
    poll?: {
        options: Array<string>;
        expires_in: number;
        multiple?: boolean;
        hide_totals?: boolean;
    };
    in_reply_to_id?: string;
    sensitive?: boolean;
    spoiler_text?: string;
    visibility?: Entity.StatusVisibility;
    scheduled_at?: string;
    language?: string;
    quote_id?: string;
}

export function isValidVisibility(
    value: string
): value is Entity.StatusVisibility {
    return ["public", "unlisted", "private", "direct"].includes(
        value as Entity.StatusVisibility
    );
}

const EditDialog: Component<EditDialogProps> = (props) => {
    const auth = useAuth();
    const editingOverlayContext = useEditOverlayContext();
    const navigate = useNavigate();

    const [posted, setPosted] = createSignal(false);
    const [postId, setPostId] = createSignal<string | null>(null);
    // bubble up submit
    createEffect(() => {
        console.log("posted() changed?");
        if (posted()) {
            console.log("bubbling up...");
            const new_id = postId();
            if (new_id) {
                props.onSubmit?.(new_id);
            }
            // TODO: technically not supposed to do this due to infinite loops.
            // should be fine :x
            setPosted(false);
        }
    });

    const [busy, setBusy] = createSignal(false);
    const [cwVisible, setCwVisible] = createSignal(false);
    const [rawCwContent, setCwContent] = createSignal("");
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
    const [status, setStatus] = createSignal("");
    const [visibility, setVisibility] =
        createSignal<Entity.StatusVisibility>("unlisted");

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
        };
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
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent class="flex-grow flex-1 w-full">
                <form
                    onsubmit={async (ev) => {
                        ev.preventDefault();
                        if (!auth.signedIn) {
                            pushError(
                                "Can't post if there are no accounts logged in."
                            );
                            return;
                        }

                        setBusy(true);
                        const client = await auth.assumeSignedIn.client;
                        const post_id = await sendPost(client);
                        if (post_id) {
                            setPostId(post_id);
                            setPosted(true);
                            editingOverlayContext.setShowingEditorOverlay(
                                false
                            );
                            // Reset the form
                            ev.currentTarget.form?.reset();
                            setBusy(false);
                        } else {
                            // TODO: show errors
                            console.error(postErrors().join("\n"));
                        }
                        return false;
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>New post</DialogTitle>
                    </DialogHeader>
                    <div class="flex flex-col py-3 gap-3">
                        <TextField class="border-none w-full flex-grow py-0 items-start justify-between min-h-24">
                            <TextFieldTextArea
                                tabindex="0"
                                placeholder="write your cool post"
                                class="resize-none overflow-hidden px-3 py-2 text-md"
                                disabled={busy()}
                                onInput={(e) => {
                                    setStatus(e.currentTarget.value);
                                }}
                            ></TextFieldTextArea>
                        </TextField>
                        <TextField
                            class="border-none w-full flex-shrink"
                            hidden={!cwVisible()}
                        >
                            <TextFieldInput
                                type="text"
                                class="resize-none h-6 px-3 py-0 text-sm border-none rounded-none focus-visible:ring-0"
                                placeholder="content warnings"
                                disabled={busy()}
                                onInput={(e) => {
                                    setCwContent(e.currentTarget.value);
                                }}
                            ></TextFieldInput>
                        </TextField>
                    </div>
                    <DialogFooter>
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
                                            }
                                        }}
                                    >
                                        <DropdownMenuRadioItem value="public">
                                            Public
                                        </DropdownMenuRadioItem>
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
                        </div>
                        <Button type="submit" disabled={busy()}>
                            Post
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditDialog;
