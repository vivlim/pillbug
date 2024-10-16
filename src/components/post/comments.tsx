import {
    Component,
    createMemo,
    createSignal,
    ErrorBoundary,
    For,
    Match,
    Switch,
} from "solid-js";
import { CommentPostComponent } from "~/views/comment";
import {
    PostTreeStatusNode,
    IPostTreeNode,
    PostTreePlaceholderNode,
    usePostPageContext,
} from "~/views/postpage";
import { Card } from "../ui/card";
import { useAuth } from "~/auth/auth-manager";
import { Entity, MegalodonInterface } from "megalodon";
import { isValidVisibility, PostOptions } from "~/views/editdialog";
import { IoWarningOutline } from "solid-icons/io";
import {
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenu,
} from "../ui/dropdown-menu";
import { TextFieldTextArea, TextFieldInput, TextField } from "../ui/text-field";
import { VisibilityIcon } from "../visibility-icon";
import { MenuButton } from "../ui/menubutton";
import { Button } from "../ui/button";
import { Status } from "megalodon/lib/src/entities/status";

/** A root comment appearing underneath a post. */
export const Comment: Component<{ node: IPostTreeNode }> = (props) => {
    return (
        <ErrorBoundary fallback={(err) => err}>
            <Card class="my-1 py-4 px-4 md:mr-4 md:ml-20">
                <div>
                    <Switch>
                        <Match when={props.node instanceof PostTreeStatusNode}>
                            <CommentPostComponent
                                status={
                                    (props.node as PostTreeStatusNode).status
                                }
                            />
                        </Match>
                        <Match
                            when={props.node instanceof PostTreePlaceholderNode}
                        >
                            <Card class="m-4 flex flex-row mx-20 my-1 py-1">
                                {
                                    (props.node as PostTreePlaceholderNode)
                                        .message
                                }
                            </Card>
                        </Match>
                    </Switch>
                </div>
                <div class="ml-4 md:ml-8 border-l pl-4 pr-4">
                    <For each={props.node.children}>
                        {(node, index) => <NestedComment node={node} />}
                    </For>
                </div>
            </Card>
        </ErrorBoundary>
    );
};

/** A nested comment that is within a root comment. */
const NestedComment: Component<{ node: IPostTreeNode }> = (props) => {
    return (
        <ErrorBoundary fallback={(err) => err}>
            <Switch>
                <Match when={props.node instanceof PostTreeStatusNode}>
                    <CommentPostComponent
                        status={(props.node as PostTreeStatusNode).status}
                    />
                </Match>
                <Match when={props.node instanceof PostTreePlaceholderNode}>
                    <Card class="m-4 flex flex-row mx-20 my-1 py-1">
                        {(props.node as PostTreePlaceholderNode).message}
                    </Card>
                </Match>
            </Switch>
            <div class="ml-4">
                <For each={props.node.children}>
                    {(node, index) => <NestedComment node={node} />}
                </For>
            </div>
        </ErrorBoundary>
    );
};