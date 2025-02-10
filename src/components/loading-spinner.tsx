import { IoAperture } from "solid-icons/io";
import { Component } from "solid-js";

export const PillbugLoadingSpinner: Component<{label: string}> = (props) => {
    return (
            <div class="flex flex-row items-center">
                <div>{props.label}</div>
                <div
                    class="animate-spin ml-3"
                    style="display: inline-block; font-size: xx-large;"
                >
                    <IoAperture />
                </div>
                <div class="flex-auto" />
            </div>
    );
};
