import { useParams } from "@solidjs/router";
import {
    createResource,
    createSignal,
    ErrorBoundary,
    For,
    Match,
    Show,
    Switch,
    type Component,
} from "solid-js";
import Post from "~/components/post";
import { Status } from "megalodon/lib/src/entities/status";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-context";
import { ProfileZone } from "~/components/user/profile-zone";
import { Comment } from "~/components/post/comments";

/** Fetch the info for a post and arrange its context in a nested tree structure before returning. */
export async function fetchPostInfoTree(
    authContext: AuthProviderProps,
    postId: string
): Promise<IPostTreeNode> {
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

    let rootPost: IPostTreeNode = new PostTreeStatusNode(
        requestedStatus.data,
        [],
        true
    );
    let unsortedStatuses: Status[] = [];
    unsortedStatuses.push(...requestedStatusContext.data.ancestors);
    unsortedStatuses.push(...requestedStatusContext.data.descendants);

    const status = rootPost.tryGetStatus();

    let idMap: Map<string, IPostTreeNode> = new Map();

    if (status !== undefined) {
        idMap.set(status.id, rootPost);

        // Go upwards until finding the root, in case the requested status is a reply.
        while (status.in_reply_to_id !== null) {
            const parentStatusIndex = unsortedStatuses.findIndex(
                (s) =>
                    s.id ===
                    (rootPost as PostTreeStatusNode).status.in_reply_to_id
            );
            if (parentStatusIndex === -1) {
                // The parent of this isn't available, so it's just going to be the parent.
                break;
            }

            const newRootStatus: Status = unsortedStatuses.splice(
                parentStatusIndex,
                1
            )[0];
            rootPost = new PostTreeStatusNode(newRootStatus, [rootPost]);
            idMap.set(status.id, rootPost);
        }
    }

    // Try to attach all the remaining statuses to the tree somewhere
    while (unsortedStatuses.length > 0) {
        let numAdded = 0;

        for (let i = 0; i < unsortedStatuses.length; i++) {
            const status = unsortedStatuses[i];
            if (status.in_reply_to_id === null) {
                // This is not attached to anything. Just stick it underneath the root.
                const s = new PostTreeStatusNode(status, []);
                idMap.set(status.id, s);
                rootPost.children.push(s);
                numAdded += 1;
                unsortedStatuses.splice(i, 1);
                continue;
            }
            const existingParent = idMap.get(status.in_reply_to_id);
            if (existingParent !== undefined) {
                // The parent of this status has a nestedstatus node, so we can attach this status to it now.
                const s = new PostTreeStatusNode(status, []);
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
            let statusNode = new PostTreeStatusNode(status, [], false);
            let missingPostMarker = new PostTreePlaceholderNode(
                `Missing post id ${status?.in_reply_to_id}`,
                [statusNode],
                false
            );
            idMap.set(status.id, missingPostMarker);
            rootPost.children.push(statusNode);
        }
    }

    // Now try to attach

    return rootPost;
}

/** A node within a tree of activitypub statuses and placeholders. Each node has zero to many child nodes. */
export interface IPostTreeNode {
    /** All child statuses. */
    children: IPostTreeNode[];
    /** Whether this status should be displayed with a highlight. When following a link to a post, this will indicate which post the link was for. */
    highlighted: boolean;
    /** Try to get the activitypub status in this node, if there is one. */
    tryGetStatus(): Status | undefined;
}

/** An activitypub status whose replies have been arranged in a nested structure. Each status has zero to many child nodes. */
export class PostTreeStatusNode implements IPostTreeNode {
    /** The source status. */
    status: Status;
    /** All child statuses. */
    children: IPostTreeNode[];
    /** Whether this status should be displayed with a highlight. When following a link to a post, this will indicate which post the link was for. */
    highlighted: boolean;
    constructor(
        status: Status,
        children: IPostTreeNode[],
        highlighted: boolean = false
    ) {
        /**  */
        this.status = status;
        /**  */
        this.children = children;
        /**  */
        this.highlighted = highlighted;
    }
    tryGetStatus(): Status | undefined {
        return this.status;
    }
}

/** A placeholder within an arranged structure of activitypub statuses & replies. If we cannot locate a parent status, a placeholder can be inserted instead. */
export class PostTreePlaceholderNode implements IPostTreeNode {
    /** The text to show in the placeholder. */
    message: string;
    /** All child statuses. */
    children: PostTreeStatusNode[];
    /** Whether this status should be displayed with a highlight. Probably irrelevant for placeholders. */
    highlighted: boolean;
    constructor(
        message: string,
        children: PostTreeStatusNode[],
        highlighted: boolean = false
    ) {
        this.message = message;
        this.children = children;
        this.highlighted = highlighted;
    }
    tryGetStatus(): Status | undefined {
        return undefined;
    }
}

export type CommentProps = {
    status: Status;
};

/** A page showing a root post and nested tree of comments */
const PostPage: Component = () => {
    const authContext = useAuthContext();
    const params = useParams();
    const [postId, setPostId] = createSignal<string>(params.postId);
    const [threadInfo] = createResource(postId, (p) =>
        fetchPostInfoTree(authContext, p)
    );

    return (
        <div class="flex flex-col md:flex-row mx-1 md:mx-4 gap-4">
            <Show
                when={threadInfo()?.tryGetStatus() !== undefined}
                fallback={<div>Loading</div>}
            >
                <ProfileZone userInfo={threadInfo()!.tryGetStatus()!.account} />
            </Show>
            <div class="grow flex flex-col justify-start">
                <ErrorBoundary fallback={(err) => err}>
                    <Switch>
                        <Match when={threadInfo.loading}>
                            <div>loading post</div>
                        </Match>
                        <Match when={threadInfo.state === "ready"}>
                            <Post
                                class="md:px-0"
                                status={
                                    threadInfo()?.tryGetStatus() as Status /* i don't think a placeholder should ever become root? Unless maybe it can't be found? unclear */
                                }
                                fetchShareParent={true}
                            />
                            <For each={threadInfo()?.children}>
                                {(node, index) => <Comment node={node} />}
                            </For>
                        </Match>
                        <Match when={threadInfo.error}>
                            <div>error: {threadInfo.error}</div>
                        </Match>
                    </Switch>
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default PostPage;
