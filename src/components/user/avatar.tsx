import { A } from "@solidjs/router";
import { Entity } from "megalodon";
import { Component, createMemo } from "solid-js";
import { cn } from "~/lib/utils";

export interface AvatarProps {
    /** The user the avatar applies to. */
    user: Entity.Account;
    /** The size represented in tailwind; e.g., "2" for "size-2". */
    twSize?: string;
    /** Additional classes to add to the div element. */
    class?: string;
    /** A textual representation of the image.
     *
     * @default "Avatar for (display name)"
     */
    alt?: string;
}

/**
 * Represents a user's avatar in a way that respects prefers-reduced-motion.
 */
export const AvatarImage: Component<AvatarProps> = (props) => {
    const sizeClass = `size-${props.twSize ?? "md"}`;
    return (
        <div
            class={cn(
                "flex-none rounded-md aspect-square overflow-hidden",
                sizeClass,
                props.class
            )}
        >
            <picture>
                <source
                    srcset={props.user.avatar_static}
                    class={sizeClass}
                    media="(prefers-reduced-motion: reduced)"
                />
                <img
                    src={props.user.avatar}
                    class={sizeClass}
                    alt={props.alt ?? `Avatar for ${props.user.display_name}`}
                />
            </picture>
        </div>
    );
};

/**
 * A helper component that wraps {@link AvatarImage} with a link to the user's
 * profile page.
 */
export const AvatarLink: Component<AvatarProps> = (props) => {
    const profileRoute = `/user/${props.user.acct}`;

    return (
        <A href={profileRoute}>
            <AvatarImage {...props} />
        </A>
    );
};
