import { IoWarningOutline } from "solid-icons/io";
import { Button } from "./ui/button";
import { Component, createSignal, JSX, Match, Switch } from "solid-js";

export interface ContentGuardProps {
    defaultShow?: boolean;
    warnings: string;
    children: JSX.Element;
}

export const ContentGuard: Component<ContentGuardProps> = (props) => {
    const [hidden, setHidden] = createSignal(props.defaultShow ?? true);
    return (
        <Switch fallback={props.children}>
            <Match when={props.warnings.trim().length > 0}>
                <div class="flex flex-row gap-2 items-center p-2">
                    <div class="flex flex-row items-center gap-2 flex-grow p-2 border bg-amber-200 dark:bg-yellow-950 border-yellow-800 dark:border-amber-500 rounded-sm text-amber-950 dark:text-amber-200">
                        <IoWarningOutline class="size-5" />
                        <p>
                            This post has the content warnings:{" "}
                            <strong>{props.warnings}</strong>
                        </p>
                    </div>
                    <Button
                        type="default"
                        onClick={() => {
                            setHidden(!hidden());
                        }}
                        class="dark:bg-amber-400 bg-amber-700 w-20"
                    >
                        <Switch fallback="Hide">
                            <Match when={hidden()}>Show</Match>
                            <Match when={!hidden()}>Hide</Match>
                        </Switch>
                    </Button>
                </div>
                <div hidden={hidden()}>{props.children}</div>
            </Match>
        </Switch>
    );
};
