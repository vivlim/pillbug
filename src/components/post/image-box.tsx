import { Attachment } from "megalodon/lib/src/entities/attachment";
import {
    Component,
    createResource,
    createSignal,
    For,
    JSX,
    Match,
    splitProps,
    Switch,
} from "solid-js";
import { cn } from "~/lib/utils";
import { ImageLightbox } from "./image-lightbox";
import { useSettings } from "~/lib/settings-manager";
import { decode } from "blurhash";

interface ImageAttachmentProps {
    attachment: Attachment;
    aspectRatio: number;
    imageIndex: number;
    onClick?: (idx: number) => void;
    sensitive: boolean;
}

const ImageAttachment: Component<ImageAttachmentProps> = (props) => {
    const settings = useSettings();
    const [hidingSensitiveContent, setHidingSensitiveContent] =
        createSignal<boolean>(props.sensitive);
    let src = props.attachment.preview_url;
    if (settings.getPersistent().useFullQualityImagesAsThumbnails) {
        src = props.attachment.url;
    }
    let srcset = "";
    let sizes = "";

    if (props.attachment.preview_url && props.attachment.meta) {
        // Most implementations other than Pleroma/Akkoma
        const small_width = props.attachment.meta.small?.width ?? 400;
        srcset += `${props.attachment.preview_url} ${small_width}px `;
        const orig_width = props.attachment.meta.original?.width;
        srcset += `${props.attachment.url} ${orig_width}px `;
        sizes += `(max-width: ${small_width}px) ${small_width}px, ${orig_width}px`;
    }

    let w = Math.round(props.attachment.meta?.width ?? 256);
    let h = Math.round(
        props.attachment.meta?.height ?? 256 * props.aspectRatio
    );

    if (
        settings.getPersistent().skipBlurHashClickThroughOnSensitiveMedia &&
        hidingSensitiveContent()
    ) {
        setHidingSensitiveContent(false);
    }

    const [blurHashImage] = createResource(async () => {
        if (!props.sensitive) {
            return undefined;
        }
        let blurhash =
            props.attachment.blurhash ?? "L~D1N_WUofj[tWa$odazM{jcjsWC"; // default derived from winxp bliss wallpaper
        const pixels = decode(blurhash, w, h);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx === null) {
            return undefined;
        }
        const imageData = ctx.createImageData(w, h);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    });

    return (
        <Switch>
            <Match when={!hidingSensitiveContent()}>
                <button
                    class={
                        settings.getPersistent().imagesInPostsExpandToFullWidth
                            ? "w-full"
                            : "m-auto"
                    }
                    onClick={() => {
                        console.log(`Hello! onClick = ${props.onClick}`);
                        props.onClick?.(props.imageIndex);
                    }}
                >
                    <img
                        src={src!}
                        srcset={srcset}
                        sizes={sizes}
                        alt={props.attachment.description!}
                        class="object-cover w-full"
                        style={{ "aspect-ratio": props.aspectRatio }}
                    />
                </button>
            </Match>
            <Match when={hidingSensitiveContent()}>
                <button
                    class={
                        settings.getPersistent().imagesInPostsExpandToFullWidth
                            ? "w-full"
                            : "m-auto"
                    }
                    onClick={() => {
                        setHidingSensitiveContent(false);
                    }}
                >
                    <div style="position: relative">
                        <div style="position:absolute; top: 30%; width: 100%; text-align: center; padding: 1em; background: #00000066; color: #ffffff">
                            click to show
                        </div>
                        <img
                            src={blurHashImage()}
                            sizes={sizes}
                            alt={props.attachment.description!}
                            class="object-cover w-full"
                            style={{
                                "aspect-ratio": props.aspectRatio,
                            }}
                        />
                    </div>
                </button>
            </Match>
        </Switch>
    );
};

interface ImageBoxRowProps extends JSX.HTMLAttributes<HTMLDivElement> {
    images: Array<Attachment>;
    startIndex: number;
    onImageClick: (idx: number) => void;
    sensitive: boolean;
}

const ImageBoxRow: Component<ImageBoxRowProps> = (props) => {
    const [, rest] = splitProps(props, ["class", "images", "sensitive"]);

    // placeholder default that seems workable enough
    const defaultAspect = 4 / 3;

    // try to get the aspect ratio of the first image, which the others in the
    // row will be based on
    let aspectRatio: number;
    if (props.images[0].meta) {
        if (props.images[0].meta.small?.aspect) {
            aspectRatio = props.images[0].meta.small.aspect;
        } else if (props.images[0].meta.original?.aspect) {
            aspectRatio = props.images[0].meta.original.aspect;
        } else if (props.images[0].meta.aspect) {
            // XXX: what instance returns this?
            aspectRatio = props.images[0].meta.aspect;
        } else {
            aspectRatio = defaultAspect;
        }
    } else {
        // Akkoma/Pleroma don't preprocess images, meaning we don't know the
        // aspect ratio. I'm sure there's a way to finagle one from reading the
        // image URL metadata, but using a placeholder for now.
        aspectRatio = defaultAspect;
    }

    return (
        <div class={cn("flex flex-row content-start", props.class)} {...rest}>
            <For each={props.images}>
                {(image, index) => (
                    <ImageAttachment
                        attachment={image}
                        aspectRatio={aspectRatio}
                        imageIndex={props.startIndex + index()}
                        onClick={props.onImageClick!}
                        sensitive={props.sensitive}
                    />
                )}
            </For>
        </div>
    );
};

export interface ImageBoxProps extends JSX.HTMLAttributes<HTMLDivElement> {
    attachments: Array<Attachment>;
    sensitive: boolean;
}

// Turns an array of a given type into an array of arrays, sized appropriately
function asChunks<T>(input: Array<T>, chunkSize: number): Array<Array<T>> {
    return input.reduce((result: T[][], item, index) => {
        const chunkIdx = Math.floor(index / chunkSize);
        result[chunkIdx] = result[chunkIdx] ?? [];
        result[chunkIdx].push(item);

        return result;
    }, []);
}

export const ImageBox: Component<ImageBoxProps> = (props) => {
    const [lightboxOpen, setLightboxOpen] = createSignal(false);
    const [lightboxIndex, setLightboxIndex] = createSignal(0);
    // We only handle image attachments
    const images = props.attachments.filter((att) => att.type == "image");

    const onImageClick = (idx: number) => {
        console.log(`Showing lightbox for image ${idx}`);
        setLightboxIndex(idx);
        setLightboxOpen(true);
    };

    // Split multiple images into rows
    let chunkSize;
    if (images.length == 0) {
        // No images to make a box for
        return <></>;
    } else if (images.length == 1) {
        chunkSize = 1;
    } else if (images.length % 2 == 0) {
        chunkSize = 2;
    } else {
        chunkSize = 3;
    }
    const imagesChunked = asChunks(images, chunkSize);

    return (
        <>
            <ImageLightbox
                open={lightboxOpen()}
                images={images}
                imageIndex={lightboxIndex()}
                onOpenChange={(isOpen) => {
                    setLightboxOpen(isOpen);
                }}
            />
            <div class="flex-col w-full justify-between">
                <For each={imagesChunked}>
                    {(chunk, index) => (
                        <ImageBoxRow
                            images={chunk}
                            startIndex={index() * chunkSize}
                            onImageClick={onImageClick}
                            sensitive={props.sensitive}
                        />
                    )}
                </For>
            </div>
        </>
    );
};
