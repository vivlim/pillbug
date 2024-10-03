import { Attachment } from "megalodon/lib/src/entities/attachment";
import { Component, For, JSX, splitProps } from "solid-js";
import { cn } from "~/lib/utils";

interface ImageBoxRowProps extends JSX.HTMLAttributes<HTMLDivElement> {
    images: Array<Attachment>;
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

    // TODO: clickable lightbox per image
    return (
        <div class={cn("flex flex-row content-start", props.class)} {...rest}>
            <For each={props.images}>
                {(image, index) => (
                    <img
                        src={image.preview_url ?? image.text_url ?? ""}
                        class="object-cover w-full"
                        style={{ "aspect-ratio": aspectRatio }}
                        alt={image.description ?? undefined}
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
    // We only handle image attachments
    const images = props.attachments.filter((att) => att.type == "image");
    let imagesChunked;
    if (images.length == 0) {
        // No images to make a box for
        return <></>;
    } else if (images.length == 1) {
        return <ImageBoxRow images={images} />;
    } else if (images.length % 2 == 0) {
        imagesChunked = asChunks(images, 2);
    } else {
        imagesChunked = asChunks(images, 3);
    }

    return (
        <div class="flex-col w-full justify-between">
            <For each={imagesChunked}>
                {(chunk, _) => <ImageBoxRow images={chunk} />}
            </For>
        </div>
    );
};
