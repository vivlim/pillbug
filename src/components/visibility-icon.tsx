import { Entity } from "megalodon";
import { IconProps } from "solid-icons";
import {
    FaSolidGlobe,
    FaSolidLockOpen,
    FaSolidLock,
    FaSolidEnvelope,
} from "solid-icons/fa";
import { Component, JSX, splitProps, ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";

export interface VisibilityIconProps extends IconProps {
    value: Entity.StatusVisibility;
}

const InnerIcon: Component<VisibilityIconProps> = (props) => {
    const [, rest] = splitProps(props, ["value", "aria-label"]);

    let ariaLabel = props["aria-label"] ?? props.value;

    switch (props.value) {
        case "public":
            return <FaSolidGlobe aria-label={ariaLabel} {...rest} />;
        case "unlisted":
            return <FaSolidLockOpen aria-label={ariaLabel} {...rest} />;
        case "private":
            return <FaSolidLock aria-label={ariaLabel} {...rest} />;
        case "direct":
            return <FaSolidEnvelope aria-label={ariaLabel} {...rest} />;
    }
};

function getInnerIcon(value: Entity.StatusVisibility): Component<IconProps> {
    switch (value) {
        case "public":
            return FaSolidGlobe;
        case "unlisted":
            return FaSolidLockOpen;
        case "private":
            return FaSolidLock;
        case "direct":
            return FaSolidEnvelope;
    }
}

// Dynamic icon representing the post visibility.
export const VisibilityIcon: Component<VisibilityIconProps> = (props) => {
    const [, rest] = splitProps(props, ["value"]);
    return (
        <>
            <Dynamic component={getInnerIcon(props.value)} {...rest} />
        </>
    );
};
