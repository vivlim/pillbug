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
import {
    EditorProps,
    NewCommentEditorProps,
    ValidationError,
} from "./editor-types";
import { unwrap } from "solid-js/store";

export const EditorComponent: Component<EditorProps> = ({
    model,
    validator,
    submitter,
    config,
}) => {
    // shorthand for whether controls should be active or not.
    const busy = createMemo(() => {
        return model.stage !== "idle";
    });

    return (
        <form
            onsubmit={async (ev) => {
                ev.preventDefault();
                try {
                    model.setStage("validating");
                    // Unwrap the document, it doesn't need to be reactive now
                    const doc = unwrap(model.document);

                    const validationErrors = await validator.validate(doc);
                    model.setValidationErrors(validationErrors);
                    if (validationErrors.length > 0) {
                        model.setStage("idle");
                        return;
                    }

                    model.setStage("submitting");
                    const submitErrors = await submitter.submit(doc);
                    model.setValidationErrors(submitErrors);
                    if (submitErrors.length > 0) {
                        model.setStage("idle");
                        return;
                    }

                    model.setStage("submitted");
                } catch (err) {
                    if (err instanceof Error) {
                        model.setValidationErrors([
                            new ValidationError(err.stack ?? err.message),
                        ]);
                        model.setStage("idle");
                    }
                }
                return false;
            }}
        >
            <div class="flex flex-col gap-3">
                <TextField class="border-none w-full flex-grow py-0 items-start justify-between">
                    <TextFieldTextArea
                        tabindex="0"
                        placeholder={config.bodyPlaceholder}
                        class="resize-none overflow-hidden px-3 py-2 text-md border-2 rounded-md"
                        disabled={busy()}
                        onInput={(e) => {
                            model.set("body", e.currentTarget.value);
                        }}
                        value={model.document.body}
                    ></TextFieldTextArea>
                </TextField>
                <TextField
                    class="border-none w-full flex-shrink"
                    hidden={!model.document.cwVisible}
                >
                    <TextFieldInput
                        type="text"
                        class="resize-none px-3 py-2 text-sm border-2 rounded-md focus-visible:ring-0"
                        placeholder="content warnings"
                        disabled={busy()}
                        onInput={(e) => {
                            model.set("cwContent", e.currentTarget.value);
                        }}
                        value={model.document.cwContent}
                    ></TextFieldInput>
                </TextField>
            </div>
            <div>
                <div class="flex-grow flex flex-row gap-2">
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
                    <Button type="submit" disabled={busy()}>
                        Post
                    </Button>
                </div>
            </div>
        </form>
    );
};
