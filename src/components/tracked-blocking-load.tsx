import {
    Component,
    createSignal,
    ErrorBoundary,
    For,
    JSX,
    lazy,
    Match,
    Show,
    Switch,
} from "solid-js";
import { TextField, TextFieldTextArea } from "./ui/text-field";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { error } from "console";
import {
    BlockingLoadProgressTracker,
    LoadingOperation,
} from "~/lib/blocking-load";
import { ErrorBox } from "./error";

export interface ErrorBoxProps {
    error: any;
    description: string;
}

export const TrackedBlockingLoadComponent: Component<{
    tracker: BlockingLoadProgressTracker;
    children: JSX.Element;
    loadingCardClass?: string | undefined;
}> = (props) => {
    return (
        <Switch>
            <Match when={props.tracker.areAllOperationsComplete()}>
                <ErrorBoundary
                    fallback={(e) => (
                        <ErrorBox error={e} description="Failed to start" />
                    )}
                >
                    {props.children}
                </ErrorBoundary>
            </Match>
            <Match when={!props.tracker.areAllOperationsComplete()}>
                <Card class={props.loadingCardClass}>
                    <CardHeader>
                        <CardTitle>loading!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul>
                            <For each={props.tracker.getActiveOperations()}>
                                {(op, index) => (
                                    <LoadOperationComponent operation={op} />
                                )}
                            </For>
                        </ul>
                    </CardContent>
                </Card>
            </Match>
        </Switch>
    );
};

const LoadOperationComponent: Component<{ operation: LoadingOperation }> = (
    props
) => {
    return (
        <li class="flex flex-row gap-2 py-2">
            <span class="flex-0">
                <Switch>
                    <Match when={props.operation.complete}>✔️</Match>
                    <Match when={!props.operation.complete}>⏳</Match>
                </Switch>
            </span>
            <span class="flex-1">{props.operation.label}</span>
        </li>
    );
};
