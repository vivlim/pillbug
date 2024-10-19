import {
    Accessor,
    Component,
    createMemo,
    createSignal,
    ErrorBoundary,
    For,
    JSX,
    Match,
    Setter,
    Show,
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
import {
    EditorActions,
    EditorAttachment,
    EditorConfig,
    EditorDocumentModel,
    EditorProps,
    IEditorSubmitter,
    IEditorTransformer,
    NewCommentEditorProps,
    ValidationError,
} from "./editor-types";
import { unwrap } from "solid-js/store";
import { MegalodonPostStatus } from "./megalodon-status-transformer";
import { KeyboardShortcutTextArea } from "../ui/keyboard-shortcut-text-field";
import { KeyBindingMap } from "tinykeys";
import { filesize } from "filesize";

export const MegalodonStatusEditorComponent: Component<
    EditorProps<MegalodonPostStatus, string>
> = (props) => {
    return new EditorComponentBase<MegalodonPostStatus>(props).makeComponent();
};

/** Extensible base for constructing different editor components */
class EditorComponentBase<TOutput> {
    protected model: EditorDocumentModel;
    protected transformer: IEditorTransformer<TOutput>;
    protected submitter: IEditorSubmitter<TOutput, string>;
    protected config: EditorConfig;
    protected setNewPostId: Setter<string | undefined>;
    protected class: string | undefined;

    /** controls whether controls should be active or not. */
    protected busy: Accessor<boolean>;

    constructor(props: EditorProps<TOutput, string>) {
        this.model = props.model;
        this.transformer = props.transformer;
        this.submitter = props.submitter;
        this.config = props.config;
        this.setNewPostId = props.setNewPostId;
        this.class = props.class;

        // shorthand for whether controls should be active or not.
        this.busy = createMemo(() => {
            return this.model.stage !== "idle";
        });
    }

    /** perform an 'action' */
    protected async performAction(action: EditorActions) {
        console.log(`editor ${action}: starting attempt`);
        this.model.setValidationErrors([]);
        this.model.setStage("validating");
        // Unwrap the document, it doesn't need to be reactive now
        const doc = unwrap(this.model.document);

        const transformResult = await this.transformer.validateAndTransform(
            doc
        );
        if (transformResult.errors.length > 0) {
            console.log(
                `editor ${action}: validation failed with ${transformResult.errors.length} errors`
            );
            this.model.setValidationErrors(transformResult.errors);
            this.model.setStage("idle");
            return;
        }
        console.log(`editor ${action}: validation succeeded`);

        if (transformResult.output === undefined) {
            this.model.setValidationErrors([
                new ValidationError(
                    "Failed to transform message, and no explicit errors were returned. This is a bug."
                ),
            ]);
            console.log(`editor ${action}: transforming the document failed`);
            this.model.setStage("idle");
            return;
        }

        this.model.setStage("submitting");
        try {
            console.log(`editor ${action}: submitting the post`);
            const newPostId = await this.submitter.submit(
                transformResult.output,
                this.model.document.attachments,
                action
            );

            this.setNewPostId(newPostId);
        } catch (e) {
            if (e instanceof Error) {
                this.model.setValidationErrors([
                    new ValidationError(e.stack ?? e.message),
                ]);
            }
            console.log(`editor ${action}: submitting failed`);
            this.model.setStage("idle");
            return;
        }

        console.log(`editor ${action}: submitted successfully`);
        this.model.setStage("submitted");
    }

    public makeComponent(): JSX.Element {
        return (
            <form
                class={`flex flex-col gap-3 ${this.class}`}
                onsubmit={async (ev) => {
                    ev.preventDefault();
                    try {
                        await this.performAction("submit");
                    } catch (err) {
                        if (err instanceof Error) {
                            this.model.setValidationErrors([
                                new ValidationError(err.stack ?? err.message),
                            ]);
                            this.model.setStage("idle");
                        }
                    }
                    return false;
                }}
            >
                {this.makeComponentControls()}
            </form>
        );
    }

    /** Makes the bulk of the controls used in the editor component */
    protected makeComponentControls(): JSX.Element {
        const config = this.config;
        const model = this.model;

        const keyboardShortcuts: Accessor<KeyBindingMap> = createMemo(() => {
            return {
                "Control+Enter": () => {
                    console.log("pushed ctrl+enter");
                    this.performAction("submit");
                },
            };
        });

        const onPaste = (e: ClipboardEvent) => {
            console.log("entering clipboard handler");
            if (e.clipboardData === null) {
                console.log("no clipboard data.");
                return;
            }

            // Does the clipboard being pasted contain files?
            if (e.clipboardData.types.includes("Files")) {
                console.log("clipboard has files");
                for (let i = 0; i < e.clipboardData.items.length; i++) {
                    let transferItem = e.clipboardData.items[i];
                    let file = e.clipboardData.files[i];
                    /*
                    const image_types = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
                    if (!image_types.includes(transferItem.type)){
                        continue; // not an image.
                    }
                    */

                    model.setAttachment(model.document.attachments.length, {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        file: file,
                    });
                }
            } else {
                console.log("clipboard has no files");
            }
        };

        return (
            <>
                <TextField class="border-none w-full flex-grow py-0 items-start justify-between">
                    <KeyboardShortcutTextArea
                        tabindex={0}
                        placeholder={config.bodyPlaceholder}
                        class="resize-none overflow-hidden px-3 py-2 text-md border-2 rounded-md"
                        disabled={this.busy()}
                        value={model.document.body}
                        setValue={(b: string) => model.set("body", b)}
                        shortcuts={keyboardShortcuts()}
                        onPaste={onPaste}
                    ></KeyboardShortcutTextArea>
                </TextField>
                <TextField
                    class="border-none w-full flex-shrink"
                    hidden={!model.document.cwVisible}
                >
                    <TextFieldInput
                        type="text"
                        class="resize-none px-3 py-2 text-sm border-2 rounded-md focus-visible:ring-0"
                        placeholder="content warnings"
                        disabled={this.busy()}
                        onInput={(e) => {
                            model.set("cwContent", e.currentTarget.value);
                        }}
                        value={model.document.cwContent}
                    ></TextFieldInput>
                </TextField>
                <div class="flex flex-row gap-2">
                    <MenuButton
                        onClick={() => {
                            model.set("cwVisible", !model.document.cwVisible);
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
                                value={model.document.visibility}
                                class="size-4"
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent class="w-48">
                            <DropdownMenuRadioGroup
                                value={model.document.visibility}
                                onChange={(val) => {
                                    if (isValidVisibility(val)) {
                                        model.set("visibility", val);
                                    } // TODO: ignore it for now, but otherwise uh, explode or something
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
                    <div class="flex-1" />
                    {this.actionButtons()}
                </div>
                <Show when={model.validationErrors.length > 0}>
                    <div>
                        Failed to post
                        <ul>
                            <For each={model.validationErrors}>
                                {(e) => <li>{e.message}</li>}
                            </For>
                        </ul>
                    </div>
                </Show>
                <For each={model.document.attachments}>
                    {(a, idx) => (
                        <AttachmentComponent
                            attachment={a}
                            index={idx()}
                            model={model}
                        />
                    )}
                </For>
            </>
        );
    }

    /** action buttons */
    protected actionButtons(): JSX.Element {
        return (
            <Button type="submit" disabled={this.busy()}>
                Post
            </Button>
        );
    }
}

const AttachmentComponent: Component<{
    attachment: EditorAttachment;
    index: number;
    model: EditorDocumentModel;
}> = ({ attachment, index, model }) => {
    const imgUrl = URL.createObjectURL(attachment.file);
    return (
        <div class="border-2 rounded-md p-4">
            <p>
                {attachment.name}: {filesize(attachment.size)} {attachment.type}
            </p>
            <img src={imgUrl} style="max-height: 25vh" />
            <input
                type="text"
                class="resize-none px-3 py-2 text-sm border-2 rounded-md focus-visible:ring-0
flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
                "
                placeholder="image description"
                onInput={(e) => {
                    const newAttachment = { ...attachment };
                    newAttachment.description = e.currentTarget.value;
                    model.setAttachment(index, newAttachment);
                }}
                value={attachment.description ?? ""}
            ></input>
        </div>
    );
};
