import type { Component, ComponentProps, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { cn } from "~/lib/utils";

export const LayoutColumnsRootId = "layoutColumnsRoot";
export const LayoutLeftColumnRootId = "layoutLeftColumn";
export const LayoutColumnsRoot: Component<ComponentProps<"div">> = (props) => {
    const [local, others] = splitProps(props, ["class"]);
    return (
        <div
            /*
            class={cn(
                "flex flex-grow flex-row mx-4 gap-4 md:justify-center max-w-4xl overflow-hidden",
                local.class
            )}
                */
            id={LayoutColumnsRootId}
            {...others}
        />
    );
};

/** Portal for mounting additional columns */
export const LayoutColumnPortal: Component<{ children: JSX.Element }> = (
    props
) => {
    return (
        <Portal mount={document.getElementById(LayoutColumnsRootId)!}>
            {props.children}
        </Portal>
    );
};

/** Portal for mounting components in the left column area */
export const LayoutLeftColumnPortal: Component<{ children: JSX.Element }> = (
    props
) => {
    return (
        <Portal mount={document.getElementById(LayoutLeftColumnRootId)!}>
            {props.children}
        </Portal>
    );
};

export const LayoutMainColumn: Component<ComponentProps<"div">> = (props) => {
    const [local, others] = splitProps(props, ["class"]);
    return (
        <div
            /*
            class={cn(
                "flex-grow max-w-4xl flex flex-col justify-start",
                local.class
            )}
                */
            id={"layoutMainColumn"}
            {...others}
        />
    );
};

export const LayoutLeftColumn: Component<ComponentProps<"div">> = (props) => {
    const [local, others] = splitProps(props, ["class"]);
    return (
        <div
            /*
            class={cn(
                "md:flex-none md:mt-4 md:flex md:h-fit overflow-hidden w-64",
                local.class
            )}
                */
            id={LayoutLeftColumnRootId}
            {...others}
        />
    );
};
