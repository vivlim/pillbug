import type {
    Component,
    ComponentProps,
    JSX,
    Setter,
    ValidComponent,
} from "solid-js";
import { splitProps } from "solid-js";

import * as DialogPrimitive from "@kobalte/core/dialog";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";

import { cn } from "../lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal: Component<DialogPrimitive.DialogPortalProps> = (props) => {
    const [, rest] = splitProps(props, ["children"]);
    return (
        <DialogPrimitive.Portal {...rest}>
            <dialog class="fixed inset-0 h-auto w-full max-h-screen max-w-full z-50 flex flex-grow items-center justify-center gap-6 bg-transparent px-0 py-12 text-inherit">
                {props.children}
            </dialog>
        </DialogPrimitive.Portal>
    );
};

type DialogOverlayProps<T extends ValidComponent = "div"> =
    DialogPrimitive.DialogOverlayProps<T> & { class?: string | undefined };

const DialogOverlay = <T extends ValidComponent = "div">(
    props: PolymorphicProps<T, DialogOverlayProps<T>>
) => {
    const [, rest] = splitProps(props as DialogOverlayProps, ["class"]);
    return (
        <DialogPrimitive.Overlay
            class={cn(
                "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
                props.class
            )}
            {...rest}
        />
    );
};

type DialogContentProps<T extends ValidComponent = "div"> =
    DialogPrimitive.DialogContentProps<T> & {
        class?: string | undefined;
        children?: JSX.Element;
    };

const DialogContent = <T extends ValidComponent = "div">(
    props: PolymorphicProps<T, DialogContentProps<T>>
) => {
    const [, rest] = splitProps(props as DialogContentProps, [
        "class",
        "children",
    ]);
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                class={cn(
                    "flex flex-grow flex-col z-50 h-auto max-h-screen max-w-lg overflow-y-auto border bg-background shadow-lg sm:rounded-lg duration-200 data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[expanded]:slide-in-from-left-1/2 data-[expanded]:slide-in-from-top-[48%]",
                    props.class
                )}
                {...rest}
            >
                {props.children}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
};

const DialogHeader: Component<ComponentProps<"div">> = (props) => {
    const [, rest] = splitProps(props, ["class", "children"]);
    return (
        <div
            class={cn(
                "flex flex-row justify-center items-center px-3 py-4 sm:text-left border-b",
                props.class
            )}
            {...rest}
        >
            <div class="flex-grow">{props.children}</div>
            <DialogPrimitive.CloseButton
                class="w-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[expanded]:bg-accent data-[expanded]:text-muted-foreground"
                tabIndex="-1"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="size-4"
                >
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                </svg>
                <span class="sr-only">Close</span>
            </DialogPrimitive.CloseButton>
        </div>
    );
};

const DialogFooter: Component<ComponentProps<"div">> = (props) => {
    const [, rest] = splitProps(props, ["class"]);
    return (
        <div
            class={cn(
                "flex flex-row items-center sm:space-x-2 px-3 py-4 border-t",
                props.class
            )}
            {...rest}
        />
    );
};

type DialogTitleProps<T extends ValidComponent = "h2"> =
    DialogPrimitive.DialogTitleProps<T> & {
        class?: string | undefined;
    };

const DialogTitle = <T extends ValidComponent = "h2">(
    props: PolymorphicProps<T, DialogTitleProps<T>>
) => {
    const [, rest] = splitProps(props as DialogTitleProps, ["class"]);
    return (
        <DialogPrimitive.Title
            class={cn(
                "text-lg font-semibold leading-none tracking-tight",
                props.class
            )}
            {...rest}
        />
    );
};

type DialogDescriptionProps<T extends ValidComponent = "p"> =
    DialogPrimitive.DialogDescriptionProps<T> & {
        class?: string | undefined;
    };

const DialogDescription = <T extends ValidComponent = "p">(
    props: PolymorphicProps<T, DialogDescriptionProps<T>>
) => {
    const [, rest] = splitProps(props as DialogDescriptionProps, ["class"]);
    return (
        <DialogPrimitive.Description
            class={cn("text-sm text-muted-foreground", props.class)}
            {...rest}
        />
    );
};

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogOverlay,
    DialogDescription,
};
