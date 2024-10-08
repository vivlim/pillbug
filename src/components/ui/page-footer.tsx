import { Component, JSX, mergeProps } from "solid-js";
import { Button } from "./button";

export const PageNav: Component<{ children: JSX.Element }> = (props) => {
    return (
        <div class="flex flex-row w-full justify-between p-1 md:p-12">
            {props.children}
        </div>
    );
};
