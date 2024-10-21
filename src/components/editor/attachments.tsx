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

interface GetFilesFromInputOptions {
    accept?: string;
    capture?: string;
    multiple?: boolean;
}
function getFilesFromInput(options: GetFilesFromInputOptions): Promise<File[]> {
    return new Promise<File[]>((resolve, reject) => {
        console.log(
            `Creating input element with options: ${JSON.stringify(options)}`
        );
        let input = document.createElement("input");
        input.type = "file";
        input = Object.assign(input, options);
        input.onchange = (_) => {
            if (input === null || input === undefined) {
                reject(new Error("input element was null or undefined"));
                return;
            }

            const fileList = input.files;
            if (fileList === null) {
                reject(new Error("no files were picked"));
                return;
            }
            const filesArray = Array.from(fileList);
            resolve(filesArray);
        };

        input.click();
    });
}

export interface AddAttachmentMenuProps {
    onFileAdded: (file: File) => void;
    accept: string;
}

export const AddAttachmentMenu: Component<AddAttachmentMenuProps> = (props) => {
    const [status, setStatus] = createSignal<string>("");

    const getAttachment = async (options: GetFilesFromInputOptions = {}) => {
        try {
            const combinedOptions = {
                accept: props.accept,
                ...options,
            };
            const files = await getFilesFromInput(combinedOptions);

            for (const f of files) {
                props.onFileAdded(f);
            }

            setStatus(`ok`);
        } catch (e) {
            if (e instanceof Error) {
                setStatus(`Failed to add attachment: ${e.message}`);
            }
        }
    };

    return (
        <>
            <span>{status()}</span>
            <DropdownMenu>
                <DropdownMenuTrigger as={MenuButton<"button">} type="button">
                    <IoAttachOutline class="size-6" />
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-48">
                    <DropdownMenuItem
                        class="py-4 md:py-2"
                        onClick={() => {
                            getAttachment();
                        }}
                    >
                        attach a file
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        class="py-4 md:py-2"
                        onClick={() => {
                            getAttachment({ capture: "environment" });
                        }}
                    >
                        take a picture
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export const AttachmentList: Component<{
    attachment: EditorAttachment;
    index: number;
    model: EditorDocumentModel<any>;
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
