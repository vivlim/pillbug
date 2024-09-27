import { A } from "@solidjs/router";
import { Entity } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    createResource,
    createSignal,
    ErrorBoundary,
    For,
    Match,
    Setter,
    Show,
    Switch,
    type Component,
} from "solid-js";
import {
    AuthProviderProps,
    tryGetAuthenticatedClient,
    useAuthContext,
} from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import HtmlSandbox from "./htmlsandbox";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { TextField, TextFieldTextArea } from "~/components/ui/text-field";
import { FaSolidArrowsRotate } from "solid-icons/fa";

export type PostProps = {
    status: Status;
};

const Post: Component<PostProps> = (postData) => {
    const authContext = useAuthContext();
    const status = postData.status;

    const [showRaw, setShowRaw] = createSignal<boolean>(false);

    const userHref = `/user/${status.account.acct}`;
    const postHref = `/post/${status.id}`;

    return (
        <div class="flex flex-row px-8 py-1">
            <ErrorBoundary fallback={(err) => err}>
                <div class="w-16 flex-none">
                    <A href={userHref} class="m-2 size-16 aspect-square">
                        <img
                            src={status.account.avatar}
                            class="aspect-square"
                            alt={`the avatar of ${status.account.acct}`}
                        />
                    </A>
                </div>
                <Card class="m-4 flex-1 grow ">
                    <div class="p-3 border-b">
                        <A href={userHref} class="m-2 whitespace-nowrap">
                            {status.account.display_name}
                        </A>
                        <A href={userHref} class="m-1 text-neutral-500">
                            {status.account.acct}
                        </A>
                        <A href={postHref} class="m-1 text-neutral-500">
                            {status.created_at}
                        </A>
                        <Show when={status.reblog !== null}>
                            <FaSolidArrowsRotate class="inline-block m-1" />
                            <A
                                href={`/user/${status.reblog!.account.acct}`}
                                class="m-2 whitespace-nowrap"
                            >
                                {status.reblog!.account.display_name}
                            </A>
                            <A
                                href={`/user/${status.reblog!.account.acct}`}
                                class="m-1 text-neutral-500 whitespace-nowrap"
                            >
                                {status.reblog!.account.acct}
                            </A>
                        </Show>
                    </div>
                    <Switch>
                        <Match when={status.reblog === null}>
                            <CardContent class="p-3">
                                <HtmlSandbox html={status.content} />
                            </CardContent>
                        </Match>
                        <Match when={status.reblog !== null}>
                            <div class="p-3 border-b">
                                <A
                                    href={`/user/${
                                        status.reblog!.account.acct
                                    }`}
                                    class="m-2 whitespace-nowrap"
                                >
                                    {status.reblog!.account.display_name}
                                </A>
                                <A
                                    href={`/user/${
                                        status.reblog!.account.acct
                                    }`}
                                    class="m-1 text-neutral-500"
                                >
                                    {status.reblog!.account.acct}
                                </A>
                                <A
                                    href={`/post/${status.reblog!.id}`}
                                    class="m-1 text-neutral-500"
                                >
                                    {status.reblog!.created_at}
                                </A>
                            </div>

                            <CardContent class="p-3">
                                <HtmlSandbox html={status.reblog!.content} />
                            </CardContent>
                        </Match>
                    </Switch>
                    <Show when={showRaw()}>
                        <div class="p-3 border-t">
                            <TextField>
                                <TextFieldTextArea
                                    readOnly={true}
                                    class="h-[40vh]"
                                    value={JSON.stringify(status, null, 2)}
                                ></TextFieldTextArea>
                            </TextField>
                        </div>
                    </Show>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div class="p-3 border-t">
                                <A href={postHref}>
                                    {status.replies_count} replies
                                </A>
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem
                                onClick={() => setShowRaw(!showRaw())}
                            >
                                Show raw status
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                </Card>
            </ErrorBoundary>
        </div>
    );
};

export default Post;
