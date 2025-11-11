import * as ExifReader from "exifreader";
import { filesize } from "filesize";
import { IoAttachOutline } from "solid-icons/io";
import { Component, createResource, createSignal, For, Show } from "solid-js";
import { logger } from "~/logging";
import { runTegaki } from "~/tegaki/run-tegaki";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MenuButton } from "../ui/menubutton";
import { EditorAttachment, EditorDocumentModel } from "./editor-types";

interface GetFilesFromInputOptions {
    accept?: string;
    capture?: string;
    multiple?: boolean;
}
export function getFilesFromInput(
    options: GetFilesFromInputOptions
): Promise<File[]> {
    return new Promise<File[]>((resolve, reject) => {
        logger.info(
            `Creating input element with options: ${JSON.stringify(options)}`
        );
        let input = document.createElement("input");
        input.type = "file";
        input.value = "";
        input = Object.assign(input, options);
        var handler = (_: any) => {
            logger.info("file input element changed");
            if (input === null || input === undefined) {
                logger.info("input element was null or undefined");
                reject(new Error("input element was null or undefined"));
                return;
            }

            const fileList = input.files;
            if (fileList === null) {
                logger.info("no files were picked");
                reject(new Error("no files were picked"));
                return;
            }
            const filesArray = Array.from(fileList);
            logger.info(`${fileList.length} files`);
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

    const attachFileFromPicker = async () => {
        try {
            setStatus("awaiting attachment...");
            const files = await getFilesFromInput({ accept: props.accept });

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

    const attachFileFromPainter = async () => {
        const imageBlob = await runTegaki();
        if (imageBlob) {
            const imageFile = new File([imageBlob], "doodle.png", {
                type: "image/png",
            });
            props.onFileAdded(imageFile);
            setStatus(`attachment ok`);
        } else {
            setStatus("doodle cancelled");
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
                            attachFileFromPicker();
                        }}
                    >
                        attach a file
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        class="py-4 md:py-2"
                        onClick={() => {
                            attachFileFromPainter();
                        }}
                    >
                        create a doodle
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
        <div class="border-2 pbCard p-4">
            <div style="float: right;">
                <Button onClick={onRemoveClicked}>remove</Button>
            </div>
            <p>
                {attachment.name}: {filesize(attachment.size)} {attachment.type}
            </p>
            <img src={imgUrl} style="max-height: 25vh" />
            <input
                type="text"
                class="pbInput resize-none px-3 py-2 text-sm border-2 rounded-md focus-visible:ring-0
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
