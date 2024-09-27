import { A, useParams } from "@solidjs/router";
import { Entity } from "megalodon";
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
import Post from "./post";
import { Status } from "megalodon/lib/src/entities/status";
import CommentPostComponent from "./comment";
import { DiGraph, VertexDefinition } from "digraph-js";

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

const fetchPostInfo = async (
    authContext: AuthProviderProps,
    postId: string
) => {
    if (!authContext.authState.signedIn) {
        return;
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

    const graph = new DiGraph<VertexDefinition<Status>>();
    const statuses = [
        requestedStatus.data,
        requestedStatusContext.data.ancestors,
        requestedStatusContext.data.descendants,
    ].flat();
    graph.addVertices(...statuses.map((s) => statusNode(s)));

    const rootStatuses = [];

    for (const s of statuses) {
        if (s.in_reply_to_id !== null) {
            graph.addEdge({ from: s.in_reply_to_id, to: s.id });
        } else {
            rootStatuses.push(s);
        }
    }

    console.log(`roots: ${rootStatuses.length}`);

    if (graph.hasCycles()) {
        console.log(`graph has cycles.`);
    }

    const rootVertexId = rootStatuses.shift()?.id;
    if (rootVertexId === undefined) {
        console.log("no root vertex");
        throw new Error("no root vertex");
    }

    let anyNodesWithUnlabelledDepth = true;
    let currentDepth = 1;
    let nodeDepths = new Map<string, number>();
    while (anyNodesWithUnlabelledDepth) {
        anyNodesWithUnlabelledDepth = false;

        for (const id of graph.getDeepChildren(rootVertexId, currentDepth)) {
            if (!nodeDepths.has(id)) {
                anyNodesWithUnlabelledDepth = true;
                nodeDepths.set(id, currentDepth);
            }
        }

        currentDepth += 1;
    }

    const dfsStatuses = graph.traverseEager({
        rootVertexId: rootVertexId,
        traversal: "dfs",
    });
    const firstStatus = dfsStatuses.shift();
    return {
        post: firstStatus?.body,
        comments: dfsStatuses.map((v) => {
            return { status: v.body, depth: nodeDepths.get(v.id) ?? 0 };
        }),
    };
};

interface StatusWithDepth {
    depth: number;
    status: Status;
}

function statusNode(status: Status): VertexDefinition<Status> {
    return {
        id: status.id,
        body: status,
        adjacentTo: [],
    };
}

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
                                ?.post as Status /* I don't know why this cast is necessary. todo: convince the type system correctly. */
                        }
                    />
                    <For each={threadInfo()?.comments}>
                        {(statusWithDepth, index) => (
                            <CommentPostComponent
                                status={statusWithDepth.status}
                                depth={statusWithDepth.depth}
                            />
                        )}
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
