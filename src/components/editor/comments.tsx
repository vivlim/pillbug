import {
    Component,
    createEffect,
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
import {
    EditorCommentDocument,
    EditorConfig,
    EditorDocument,
    EditorDocumentModel,
    NewCommentEditorProps,
} from "./editor-types";
import { MegalodonStatusEditorComponent } from "./component";
import { CommentTransformer } from "./comment-transformer";
import { MegalodonPostSubmitter } from "./megalodon-status-submitter";
import { CommentEditorComponent } from "./comment-component";

export const NewCommentEditor: Component<NewCommentEditorProps> = (props) => {
    const auth = useAuth();
    const postPageContext = usePostPageContext();
    const [loadProps, setLoadProps] = postPageContext.loadProps;

    const [postId, setPostId] = createSignal<string | undefined>(undefined);

    createEffect(() => {
        if (postId() !== undefined) {
            setLoadProps({
                postId: loadProps().postId,
                lastRefresh: Date.now(),
                newCommentId: postId(),
                shareEditorMode: loadProps().shareEditorMode,
            });
        }
    });

    const editorModel = new EditorDocumentModel<EditorCommentDocument>({
        body: "",
        cwContent: props.parentStatus.spoiler_text,
        cwVisible: props.parentStatus.sensitive,
        visibility: props.parentStatus.visibility,
        attachments: [],
        tagRepliedAuthor: true, // default. todo: read a setting?
        replyingTo: props.parentStatus,
    });

    const transformer = new CommentTransformer(auth, props.parentStatus);
    const submitter = new MegalodonPostSubmitter(auth.assumeSignedIn.client);
    const config: EditorConfig = {
        bodyPlaceholder: "write a comment...",
    };

    return (
        <>
            <CommentEditorComponent
                model={editorModel}
                transformer={transformer}
                submitter={submitter}
                config={config}
                setNewPostId={setPostId}
            />
        </>
    );
};
