import { Component, Show } from "solid-js";

export const LoadingAnimation: Component<{text?: string|undefined}> = (props) => {
    return <>
        <img src="pillbug-run.gif" alt="loading indicator" style="display:inline-block; margin-right: 0.5em; margin-left: 0.5em;" />
        <Show when={props.text}>
            {props.text}
        </Show>
    </>;
}