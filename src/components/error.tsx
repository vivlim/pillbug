import {
    Component,
    createMemo,
    createSignal,
    JSX,
    Match,
    Show,
    Switch,
} from "solid-js";
import { TextField, TextFieldTextArea } from "./ui/text-field";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import LoginView from "~/views/login";
import { RawDataViewer } from "./raw-data";

export interface ErrorBoxProps {
    error: any;
    description: string;
    data?: any;
}

export const ErrorBox: Component<ErrorBoxProps> = (props) => {
    const newVersionError = createMemo(() => {
        try {
            if (props.error instanceof Error) {
                // Super crude heuristic for whether the error was caused by a new version of pillbug being released.
                return (
                    props.error.message.endsWith(".js") &&
                    props.error.message.indexOf("imported module") >= 0
                );
            }
        } catch {}
        return undefined;
    });
    return (
        <Switch>
            <Match when={newVersionError()}>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            a new version of pillbug was published
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        a new version of pillbug was (probably) published;
                        please refresh to continue
                    </CardContent>
                    <CardFooter>
                        <details>
                            <summary>details</summary>

                            <p>
                                when a new version of pillbug is published,
                                previous versions' code is no longer available
                                on the server.
                            </p>
                            <p>
                                pillbug's code is broken up into several pieces
                                ('code splitting'), so that those parts can be
                                downloaded when needed, instead of all at once.
                            </p>
                            <p>
                                the pieces of pillbug that are cached in your
                                web browser don't match the currently published
                                version. so unfortunately there's currently no
                                way to continue except refreshing :(
                            </p>
                            <p>
                                <a
                                    href="https://github.com/vivlim/pillbug/issues/82"
                                    target="_blank"
                                >
                                    related github issue
                                </a>
                            </p>
                            <p>here's the specific error:</p>
                            <InnerErrorBox
                                error={props.error}
                                description={props.description}
                                data={props.data}
                            ></InnerErrorBox>
                        </details>
                    </CardFooter>
                </Card>
            </Match>
            <Match when={props.error instanceof Error}>
                <div class="p-3 border-t">
                    <InnerErrorBox
                        error={props.error}
                        description={props.description}
                        data={props.data}
                    ></InnerErrorBox>
                </div>
            </Match>
            <Match when={!(props.error instanceof Error)}>
                <Card>
                    <CardTitle>{props.description}</CardTitle>
                    <CardContent>No error info available</CardContent>
                    {/*this is duplicated from below, consider popping this into a separate component.*/}
                    <Show when={props.data !== undefined && props.data != null}>
                        <div>
                            <details>
                                <summary>
                                    click here to see data that may be related
                                    to the failure (may contain personal info)
                                </summary>
                                <RawDataViewer data={props.data} show={true} />
                            </details>
                        </div>
                    </Show>
                </Card>
            </Match>
        </Switch>
    );
};

const InnerErrorBox: Component<{
    error: Error;
    description: string;
    data?: any;
}> = (props) => {
    const [showLoginView, setShowLoginView] = createSignal<boolean>(false);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{props.description}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{props.error.message}</p>
                    <div>
                        <TextField>
                            <TextFieldTextArea
                                readOnly={true}
                                class="h-[30vh]"
                                value={props.error.stack}
                            ></TextFieldTextArea>
                        </TextField>
                    </div>
                    <Show when={props.data !== undefined && props.data != null}>
                        <div>
                            <details>
                                <summary>
                                    click here to see data that may be related
                                    to the failure (may contain personal info)
                                </summary>
                                <RawDataViewer data={props.data} show={true} />
                            </details>
                        </div>
                    </Show>
                    <div>
                        <a
                            href="https://github.com/vivlim/pillbug/issues"
                            class="underline"
                            target="_blank"
                        >
                            please consider reporting this problem on github if
                            it seems like a problem with pillbug.
                        </a>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={() => {
                            setShowLoginView(!showLoginView());
                        }}
                    >
                        access emergency login page
                    </Button>
                </CardFooter>
            </Card>
            <Show when={showLoginView()}>
                <LoginView />
            </Show>
        </>
    );
};

export default ErrorBox;
