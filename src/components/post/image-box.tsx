import { Attachment } from "megalodon/lib/src/entities/attachment";
import { Component, createSignal, For, JSX, splitProps } from "solid-js";
import { cn } from "~/lib/utils";
import { ImageLightbox } from "./image-lightbox";

interface ImageAttachmentProps {
    attachment: Attachment;
    aspectRatio: number;
    imageIndex: number;
    onClick?: (idx: number) => void;
}

const ImageAttachment: Component<ImageAttachmentProps> = (props) => {
    let src = props.attachment.text_url;
    let srcset = "";
    let sizes = "";
    if (props.attachment.preview_url && props.attachment.meta) {
        // Most implementations other than Pleroma/Akkoma
        const small_width = props.attachment.meta.small?.width ?? 400;
        srcset += `${props.attachment.preview_url} ${small_width}px `;
        const orig_width = props.attachment.meta.original?.width;
        srcset += `${props.attachment.text_url} ${orig_width}px `;
        sizes += `(max-width: ${small_width}px) ${small_width}px, ${orig_width}px`;
    }

    return (
        <button
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
    );
};

interface ImageBoxRowProps extends JSX.HTMLAttributes<HTMLDivElement> {
    images: Array<Attachment>;
    startIndex: number;
    onImageClick: (idx: number) => void;
}

const ImageBoxRow: Component<ImageBoxRowProps> = (props) => {
    const [, rest] = splitProps(props, ["class", "images"]);

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
                    />
                )}
            </For>
        </div>
    );
};

export interface ImageBoxProps extends JSX.HTMLAttributes<HTMLDivElement> {
    attachments: Array<Attachment>;
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
                        />
                    )}
                </For>
            </div>
        </>
    );
};
