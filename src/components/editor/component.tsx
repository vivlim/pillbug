import { BeforeLeaveEventArgs, useBeforeLeave } from "@solidjs/router";
import { IoWarningOutline } from "solid-icons/io";
import {
    Accessor,
    Component,
    createMemo,
    For,
    JSX,
    Setter,
    Show,
} from "solid-js";
import { unwrap } from "solid-js/store";
import { KeyBindingMap } from "tinykeys";
import { logger } from "~/logging";
import { isValidVisibility } from "~/views/editdialog";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { KeyboardShortcutTextArea } from "../ui/keyboard-shortcut-text-field";
import { MenuButton } from "../ui/menubutton";
import { TextField, TextFieldInput } from "../ui/text-field";
import { VisibilityIcon } from "../visibility-icon";
import { AddAttachmentMenu, AttachmentComponent } from "./attachments";
import {
    EditorActions,
    EditorAttachment,
    EditorConfig,
    EditorDocument,
    EditorDocumentModel,
    EditorProps,
    IEditorSubmitter,
    IEditorTransformer,
    ValidationError,
} from "./editor-types";
import { MegalodonPostStatus } from "./megalodon-status-transformer";
import { MarkdownTextField } from "../ui/markdown-text-field";

export const MegalodonStatusEditorComponent: Component<
    EditorProps<MegalodonPostStatus, string, EditorDocument>
> = (props) => {
    return new EditorComponentBase<MegalodonPostStatus, EditorDocument>(
        props
    ).makeComponent();
};

/** Extensible base for constructing different editor components */
export class EditorComponentBase<TOutput, TDoc extends EditorDocument> {
    protected model: EditorDocumentModel<TDoc>;
    protected transformer: IEditorTransformer<TDoc, TOutput>;
    protected submitter: IEditorSubmitter<TOutput, string>;
    protected config: EditorConfig;
    protected setNewPostId: Setter<string | undefined>;
    protected class: string | undefined;

    /** controls whether controls should be active or not. */
    protected busy: Accessor<boolean>;

    constructor(props: EditorProps<TOutput, string, TDoc>) {
        this.model = props.model;
        this.transformer = props.transformer;
        this.submitter = props.submitter;
        this.config = props.config;
        this.setNewPostId = props.setNewPostId;
        this.class = props.class;

        useBeforeLeave((e: BeforeLeaveEventArgs) => {
            if (this.model.stage !== "submitted") {
                if (!e.defaultPrevented && this.model.store.body.length > 0) {
                    e.preventDefault();
                    if (window.confirm("Abandon in-progress post?")) {
                        e.retry(true);
                    }
                }
            }
        });

        // shorthand for whether controls should be active or not.
        this.busy = createMemo(() => {
            return this.model.stage !== "idle";
        });
    }

    /** perform an 'action' */
    protected async performAction(action: EditorActions) {
        logger.info(`editor ${action}: starting attempt`);
        this.model.setValidationErrors([]);
        this.model.setStage("validating");
        // Unwrap the document, it doesn't need to be reactive now
        const doc = unwrap(this.model.document);

        const transformResult = await this.transformer.validateAndTransform(
            doc
        );
        if (transformResult.errors.length > 0) {
            logger.info(
                `editor ${action}: validation failed with ${transformResult.errors.length} errors`
            );
            this.model.setValidationErrors(transformResult.errors);
            this.model.setStage("idle");
            return;
        }
        logger.info(`editor ${action}: validation succeeded`);

        if (transformResult.output === undefined) {
            this.model.setValidationErrors([
                new ValidationError(
                    "Failed to transform message, and no explicit errors were returned. This is a bug."
                ),
            ]);
            logger.info(`editor ${action}: transforming the document failed`);
            this.model.setStage("idle");
            return;
        }

        this.model.setStage("submitting");
        try {
            logger.info(`editor ${action}: submitting the post`);
            const newPostId = await this.submitter.submit(
                transformResult.output,
                this.model.document.attachments,
                action
            );

            logger.info(`editor ${action}: submitted successfully`);
            this.model.setStage("submitted");

            // Setting the new post id may trigger navigation or other behavior in the calling page
            this.setNewPostId(newPostId);
        } catch (e) {
            if (e instanceof Error) {
                this.model.setValidationErrors([
                    new ValidationError(e.stack ?? e.message),
                ]);
            }
            logger.info(`editor ${action}: submitting failed`);
            this.model.setStage("idle");
            return;
        }
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

        const onPaste = (e: ClipboardEvent) => {
            logger.info("entering clipboard handler");
            if (e.clipboardData === null) {
                logger.info("no clipboard data.");
                return;
            }

            // Does the clipboard being pasted contain files?
            if (e.clipboardData.types.includes("Files")) {
                logger.info("clipboard has files");
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
                logger.info("clipboard has no files");
            }
        };

        return (
            <>
                {/* body */}
                <div class="border-none w-full flex-grow py-0 items-start justify-between">
                    <MarkdownTextField
                        class="pbPostEditor resize-none overflow-hidden px-3 py-2 text-md border-2 rounded-md"
                        placeholder={config.bodyPlaceholder}
                        disabled={this.busy()}
                        onValueChange={(b) => model.set("body", b)}
                        onPaste={onPaste}
                        onSubmit={() => this.performAction("submit")}
                    />
                </div>
                {/* tags */}
                <TextField class="border-none w-full flex-shrink">
                    <TextFieldInput
                        type="text"
                        class="resize-none px-3 py-2 text-sm border-2 rounded-md focus-visible:ring-0"
                        placeholder="tags"
                        disabled={this.busy()}
                        onInput={(e) => {
                            model.set("tags", [e.currentTarget.value]);
                        }}
                        value={model.document.tags.join(" ")}
                    />
                </TextField>
                {/* content warnings */}
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
                    />
                </TextField>
                {/* buttons */}
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
                    <AddAttachmentMenu
                        accept="image/*,audio/*,video/*"
                        onFileAdded={(file: File) => {
                            model.setAttachment(
                                model.document.attachments.length,
                                {
                                    name: file.name,
                                    type: file.type,
                                    size: file.size,
                                    file: file,
                                }
                            );
                        }}
                    ></AddAttachmentMenu>
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
                <div style="width: 100%">
                    <For each={model.document.attachments}>
                        {(a, idx) => (
                            <AttachmentComponent
                                attachment={a}
                                index={idx()}
                                model={model}
                                onRemoveClicked={() => {
                                    const newAtt: EditorAttachment[] = [];
                                    const att = model.document.attachments;
                                    for (let i = 0; i < att.length; i++) {
                                        if (i === idx()) {
                                            continue;
                                        }
                                        newAtt.push(att[i]);
                                    }
                                    model.set("attachments", newAtt);
                                }}
                            />
                        )}
                    </For>
                </div>
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
