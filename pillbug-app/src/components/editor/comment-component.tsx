import {
    Accessor,
    Component,
    createMemo,
    createSignal,
    createUniqueId,
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
import { IoAttachOutline, IoWarningOutline } from "solid-icons/io";
import {
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenu,
    DropdownMenuItem,
} from "../ui/dropdown-menu";
import { TextFieldTextArea, TextFieldInput, TextField } from "../ui/text-field";
import { VisibilityIcon } from "../visibility-icon";
import { MenuButton } from "../ui/menubutton";
import { Button } from "../ui/button";
import {
    EditorActions,
    EditorAttachment,
    EditorCommentDocument,
    EditorConfig,
    EditorDocument,
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
import { BeforeLeaveEventArgs, useBeforeLeave } from "@solidjs/router";
import { EditorComponentBase } from "./component";
import { StoreBacked } from "~/lib/store-backed";

export const CommentEditorComponent: Component<
    EditorProps<MegalodonPostStatus, string, EditorCommentDocument>
> = (props) => {
    return new CommentEditorComponentBase<MegalodonPostStatus>(
        props
    ).makeComponent();
};

class CommentEditorComponentBase<TOutput> extends EditorComponentBase<
    TOutput,
    EditorCommentDocument
> {
    protected uniqueId: string;
    constructor(props: EditorProps<TOutput, string, EditorCommentDocument>) {
        super(props);
        this.uniqueId = createUniqueId();
    }

    protected actionButtons(): JSX.Element {
        const toggleTagId = `toggle-tag-replying-to-${this.uniqueId}`;
        let replyingToName = this.model.store.replyingTo.account.acct;
        const indexOfAt = replyingToName.indexOf("@");
        if (indexOfAt > 0) {
            replyingToName = replyingToName.substring(0, indexOfAt);
        }
        return (
            <>
                <input
                    type="checkbox"
                    id={toggleTagId}
                    checked={this.model.store.tagRepliedAuthor}
                    onChange={(e) =>
                        this.model.setStore(
                            "tagRepliedAuthor",
                            e.currentTarget.checked
                        )
                    }
                />
                <label
                    for={toggleTagId}
                    class="pr-3 select-none"
                    style="align-content: center; font-size:smaller;"
                >
                    <span>tag </span>
                    <span>{replyingToName}?</span>
                </label>
                <Button type="submit" disabled={this.busy()}>
                    Comment
                </Button>
            </>
        );
    }
}
