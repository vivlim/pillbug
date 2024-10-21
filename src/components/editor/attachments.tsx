import {
    Accessor,
    Component,
    createMemo,
    createResource,
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
import * as ExifReader from "exifreader";

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
        input.value = "";
        input = Object.assign(input, options);
        var handler = (_: any) => {
            console.log("file input element changed");
            if (input === null || input === undefined) {
                console.log("input element was null or undefined");
                reject(new Error("input element was null or undefined"));
                return;
            }

            const fileList = input.files;
            if (fileList === null) {
                console.log("no files were picked");
                reject(new Error("no files were picked"));
                return;
            }
            const filesArray = Array.from(fileList);
            console.log(`${fileList.length} files`);
            resolve(filesArray);
        };
        input.addEventListener("change", handler);

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
            setStatus("awaiting attachment...");
            const combinedOptions = {
                accept: props.accept,
                ...options,
            };
            const files = await getFilesFromInput(combinedOptions);

            if (files.length === 0) {
                setStatus("no files added");
            }

            for (const f of files) {
                props.onFileAdded(f);
            }

            setStatus(`attachment ok`);
        } catch (e) {
            if (e instanceof Error) {
                setStatus(`Failed to add attachment: ${e.message}`);
            }
        }
    };

    return (
        <>
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
                </DropdownMenuContent>
            </DropdownMenu>
            <span style="align-content: center;">{status()}</span>
        </>
    );
};

type ExifTagAnalysis = {
    tags: {
        tag: string;
        value: ExifReader.XmpTag & ExifReader.ValueTag & ExifReader.PngTag;
    }[];
    warningTags: string[];
};

export const AttachmentComponent: Component<{
    attachment: EditorAttachment;
    index: number;
    model: EditorDocumentModel<any>;
    onRemoveClicked: () => void;
}> = ({ attachment, index, model, onRemoveClicked }) => {
    const imgUrl = URL.createObjectURL(attachment.file);

    const [exifTagAnalysis] = createResource<ExifTagAnalysis>(async () => {
        const buf = await attachment.file.arrayBuffer();
        const tags = await ExifReader.load(buf);

        const tagArr = [];
        const warningTags = [];
        for (let tag in tags) {
            if (tag.indexOf("GPS") >= 0) {
                warningTags.push(tag);
            }
            tagArr.push({ tag: tag, value: tags[tag] });
        }

        return {
            tags: tagArr,
            warningTags: warningTags,
        };
    });
    return (
        <div class="border-2 rounded-md p-4">
            <div style="float: right;">
                <Button onClick={onRemoveClicked}>remove</Button>
            </div>
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
                onChange={(e) => {
                    const newAttachment = { ...attachment };
                    newAttachment.description = e.currentTarget.value;
                    model.setAttachment(index, newAttachment);
                }}
                value={attachment.description ?? ""}
            ></input>
            <Show when={exifTagAnalysis() !== undefined}>
                <Show when={exifTagAnalysis()!.warningTags.length > 0}>
                    WARNING: image contains location data!
                </Show>
                <details>
                    <summary>exif tags</summary>
                    <ul class="max-h-48 overflow-auto">
                        <For each={exifTagAnalysis()!.tags}>
                            {(t) => (
                                <li class="break-all">
                                    {t.tag}: {t.value.value}
                                </li>
                            )}
                        </For>
                    </ul>
                </details>
            </Show>
        </div>
    );
};
