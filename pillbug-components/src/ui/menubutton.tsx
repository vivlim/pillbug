import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

import type { PolymorphicProps } from "@kobalte/core/polymorphic";

import { cn } from "../lib/utils";
import { Button, ButtonProps } from "./button";

export const MenuButton = <T extends ValidComponent = "button">(
    props: PolymorphicProps<T, ButtonProps>
) => {
    const [, rest] = splitProps(props as ButtonProps, ["class"]);
    return (
        <Button
            class={cn(
                "pbButtonPrimary rounded-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                props.class
            )}
            variant="ghost"
            {...rest}
        />
    );
};
