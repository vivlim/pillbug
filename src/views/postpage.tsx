import { A, useParams } from "@solidjs/router";
import { Entity } from "megalodon";
import {
    children,
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
import { tryGetAuthenticatedClient } from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import Post, { PostWithShared } from "./post";
import { Status } from "megalodon/lib/src/entities/status";
import { DiGraph, VertexDefinition } from "digraph-js";
import { CommentPostComponent } from "./comment";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-context";

type FeedProps = {
    firstPost?: number | null;
};

type GetTimelineOptions = {
    local?: boolean;
    limit?: number;
    max_id?: string;
    since_id?: string;
    min_id?: string;
};

export async function fetchPostInfo(
    authContext: AuthProviderProps,
    postId: string
): Promise<NestedStatus> {
    if (!authContext.authState.signedIn) {
        throw new Error(`Not signed in`);
    }

    const client = authContext.authState.signedIn.authenticatedClient;
    console.log(`getting post ${postId}`);

    const requestedStatus = await client.getStatus(postId);
    if (requestedStatus.status !== 200) {
        throw new Error(
            `Failed to get post ${postId}: ${requestedStatus.statusText}`
        );
    }

    const requestedStatusContext = await client.getStatusContext(postId);
    if (requestedStatusContext.status !== 200) {
        throw new Error(
            `Failed to get post ${postId}: ${requestedStatus.statusText}`
        );
    }

    let rootPost: StatusNode = new NestedStatus(requestedStatus.data, [], true);
    let unsortedStatuses: Status[] = [];
    unsortedStatuses.push(...requestedStatusContext.data.ancestors);
    unsortedStatuses.push(...requestedStatusContext.data.descendants);

    let idMap: Map<string, StatusNode> = new Map();
    idMap.set(rootPost.status.id, rootPost);

    // Go upwards until finding the root, in case the requested status is a reply.
    while (rootPost.status.in_reply_to_id !== null) {
        const parentStatusIndex = unsortedStatuses.findIndex(
            (s) => s.id === (rootPost as NestedStatus).status.in_reply_to_id
        );
        if (parentStatusIndex === -1) {
            // The parent of this isn't available, so it's just going to be the parent.
            break;
        }

        const newRootStatus: Status = unsortedStatuses.splice(
            parentStatusIndex,
            1
        )[0];
        rootPost = new NestedStatus(newRootStatus, [rootPost]);
        idMap.set(rootPost.status.id, rootPost);
    }

    // Try to attach all the remaining statuses to the tree somewhere
    while (unsortedStatuses.length > 0) {
        let numAdded = 0;

        for (let i = 0; i < unsortedStatuses.length; i++) {
            const status = unsortedStatuses[i];
            if (status.in_reply_to_id === null) {
                // This is not attached to anything. Just stick it underneath the root.
                const s = new NestedStatus(status, []);
                idMap.set(status.id, s);
                rootPost.children.push(s);
                numAdded += 1;
                unsortedStatuses.splice(i, 1);
                continue;
            }
            const existingParent = idMap.get(status.in_reply_to_id);
            if (existingParent !== undefined) {
                // The parent of this status has a nestedstatus node, so we can attach this status to it now.
                const s = new NestedStatus(status, []);
                idMap.set(status.id, s);
                existingParent.children.push(s);
                numAdded += 1;
                unsortedStatuses.splice(i, 1);
                continue;
            }
        }

        if (unsortedStatuses.length === 0) {
            break;
        }

        if (numAdded === 0) {
            let status = unsortedStatuses.pop()!;
            let statusNode = new NestedStatus(status, [], false);
            let missingPostMarker = new StatusPlaceholder(
                `Missing post id ${status?.in_reply_to_id}`,
                [statusNode],
                false
            );
            idMap.set(status.id, statusNode);
            rootPost.children.push(statusNode);
        }
    }

    // Now try to attach

    return rootPost;
}

interface ArrangedThreadContext {
    post: Status;
    comments: NestedStatus[];
}

type StatusNode = NestedStatus | StatusPlaceholder;

class NestedStatus {
    status: Status;
    children: NestedStatus[];
    highlighted: boolean;
    constructor(
        status: Status,
        children: NestedStatus[],
        highlighted: boolean = false
    ) {
        this.status = status;
        this.children = children;
        this.highlighted = highlighted;
    }
}

class StatusPlaceholder {
    message: string;
    children: NestedStatus[];
    highlighted: boolean;
    constructor(
        message: string,
        children: NestedStatus[],
        highlighted: boolean = false
    ) {
        this.message = message;
        this.children = children;
        this.highlighted = highlighted;
    }
}

function statusNode(status: Status): VertexDefinition<Status> {
    return {
        id: status.id,
        body: status,
        adjacentTo: [],
    };
}

const TopNestedComment: Component<{ node: StatusNode }> = (props) => {
    return (
        <ErrorBoundary fallback={(err) => err}>
            <Card class="m-4 mx-20 my-1 py-4 px-4">
                <div>
                    <Switch>
                        <Match when={props.node instanceof NestedStatus}>
                            <CommentPostComponent
                                status={(props.node as NestedStatus).status}
                            />
                        </Match>
                        <Match when={props.node instanceof StatusPlaceholder}>
                            <Card class="m-4 flex flex-row mx-20 my-1 py-1">
                                {(props.node as StatusPlaceholder).message}
                            </Card>
                        </Match>
                    </Switch>
                </div>
                <div class="ml-8 border-l pl-4 pr-4">
                    <For each={props.node.children}>
                        {(node, index) => <InnerNestedComment node={node} />}
                    </For>
                </div>
            </Card>
        </ErrorBoundary>
    );
};

const InnerNestedComment: Component<{ node: StatusNode }> = (props) => {
    return (
        <ErrorBoundary fallback={(err) => err}>
            <Switch>
                <Match when={props.node instanceof NestedStatus}>
                    <CommentPostComponent
                        status={(props.node as NestedStatus).status}
                    />
                </Match>
                <Match when={props.node instanceof StatusPlaceholder}>
                    <Card class="m-4 flex flex-row mx-20 my-1 py-1">
                        {(props.node as StatusPlaceholder).message}
                    </Card>
                </Match>
            </Switch>
            <div class="ml-4">
                <For each={props.node.children}>
                    {(node, index) => <InnerNestedComment node={node} />}
                </For>
            </div>
        </ErrorBoundary>
    );
};

export type CommentProps = {
    status: Status;
};

const PostPage: Component = () => {
    const authContext = useAuthContext();
    const params = useParams();
    const [postId, setPostId] = createSignal<string>(params.postId);
    const [threadInfo] = createResource(postId, (p) =>
        fetchPostInfo(authContext, p)
    );

    return (
        <ErrorBoundary fallback={(err) => err}>
            <Switch>
                <Match when={threadInfo.loading}>
                    <div>loading post</div>
                </Match>
                <Match when={threadInfo.state === "ready"}>
                    <Post
                        status={
                            threadInfo()
                                ?.status as Status /* i don't think a placeholder should ever become root? */
                        }
                        fetchShareParent={true}
                    />
                    <For each={threadInfo()?.children}>
                        {(node, index) => <TopNestedComment node={node} />}
                    </For>
                </Match>
                <Match when={threadInfo.error}>
                    <div>error: {threadInfo.error}</div>
                </Match>
            </Switch>
        </ErrorBoundary>
    );
};

export default PostPage;
