import { A } from "@solidjs/router";
import { Entity } from "megalodon";
import { Component, createMemo } from "solid-js";
import { cn } from "~/lib/utils";

export interface AvatarProps {
    /** The user the avatar applies to. */
    user: Entity.Account;
    /** Classes to be added directly to the image sources. */
    imgClass?: string;
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
    return (
        <div
            class={cn(
                "flex-none rounded-md aspect-square overflow-hidden",
                props.imgClass,
                props.class
            )}
        >
            <picture>
                <source
                    srcset={props.user.avatar_static}
                    class={props.imgClass}
                    media="(prefers-reduced-motion: reduced)"
                />
                <img
                    src={props.user.avatar}
                    class={props.imgClass}
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
        <A href={profileRoute} class="h-max">
            <AvatarImage {...props} />
        </A>
    );
};
