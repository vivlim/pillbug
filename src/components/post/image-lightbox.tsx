import { DialogPortalProps } from "@kobalte/core/dialog";
import { Attachment } from "megalodon/lib/src/entities/attachment";
import {
    Component,
    createEffect,
    createMemo,
    createSignal,
    Show,
} from "solid-js";
import { Dialog, DialogOverlay } from "../ui/dialog";
import * as DialogPrimitive from "@kobalte/core/dialog";
import { Dynamic } from "solid-js/web";
import { Button } from "../ui/button";
import { logger } from "~/logging";

const InnerImage: Component<{ image: Attachment }> = (props) => {
    // set the max height to the screen height, -5rem for the margine, and -3rem
    // for most alt texts. we allow scrolling, so even longer alt texts
    // shouldn't be an issue
    return (
        <img
            class="max-h-[calc(100vh-8rem)] object-scale-down mb-2 mx-auto pointer-events-auto"
            src={props.image.url!}
            alt={props.image.description!}
        />
    );
};

export interface ImageLightboxProps {
    images: Array<Attachment>;
    imageIndex?: number;
    open?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}

// HACK: there *has* to be a better way to do this, but this works for now
function imageFor(image: Attachment) {
    return () => {
        return <InnerImage image={image} />;
    };
}

function descFor(image: Attachment) {
    return () => {
        return <p class="flex-grow text-center">{image.description!}</p>;
    };
}

export const ImageLightbox: Component<ImageLightboxProps> = (props) => {
    const [index, setIndex] = createSignal(props.imageIndex ?? 0);
    // outer index takes precedence
    createEffect(() => {
        if (props.imageIndex != null) {
            logger.info("Updating index");
            if (
                props.imageIndex >= props.images.length ||
                props.imageIndex < 0
            ) {
                console.error(
                    `provided index ${props.imageIndex} out of bounds, setting to 0`
                );
                setIndex(0);
            } else {
                setIndex(props.imageIndex);
            }
        }
    });

    const isFirst = createMemo(() => index() == 0);
    const isLast = createMemo(() => index() == props.images.length - 1);

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogOverlay class="flex flex-row items-center inset-0">
                <div class="flex items-center flex-col h-auto w-full my-10 overflow-y-scroll">
                    <DialogPrimitive.Content class="max-w-fit mx-auto !pointer-events-none">
                        <Dynamic component={imageFor(props.images[index()])} />
                        <div class="flex flex-row gap-4 pointer-events-auto max-w-prose mx-auto">
                            <Button
                                class={isFirst() ? "invisible" : "visible"}
                                onClick={() => {
                                    setIndex(index() - 1);
                                }}
                            >
                                &lt;&lt;
                            </Button>
                            <Dynamic
                                component={descFor(props.images[index()])}
                            />
                            <Button
                                onClick={() => {
                                    setIndex(index() + 1);
                                }}
                                class={isLast() ? "invisible" : "visible"}
                            >
                                &gt;&gt;
                            </Button>
                        </div>
                    </DialogPrimitive.Content>
                </div>
            </DialogOverlay>
        </Dialog>
    );
};
