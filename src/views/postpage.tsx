import { useParams } from "@solidjs/router";
import {
    createContext,
    createResource,
    createSignal,
    ErrorBoundary,
    For,
    Match,
    ResourceFetcher,
    Show,
    Signal,
    Switch,
    useContext,
    type Component,
} from "solid-js";
import Post from "~/components/post";
import { Status } from "megalodon/lib/src/entities/status";
import { useAuth } from "~/auth/auth-manager";
import { ProfileZone } from "~/components/user/profile-zone";
import { Comment, NewCommentEditor } from "~/components/post/comments";
import { Card } from "~/components/ui/card";
import { ErrorBox } from "~/components/error";
import { MaybeSignedInState } from "~/auth/auth-types";

/** Fetch the info for a post and arrange its context in a nested tree structure before returning. */
export async function fetchPostInfoTree(
    props: {
        loadProps: LoadPostsProps;
        signedInState: MaybeSignedInState;
    },
    previousTree: IPostTreeNode | undefined
): Promise<IPostTreeNode> {
    const loadPostsProps = props.loadProps;
    const signedInState = props.signedInState;

    console.log(
        `fetching post info tree with props: ${JSON.stringify(loadPostsProps)}`
    );
    if (!signedInState?.signedIn) {
        return new PostTreePlaceholderNode("not signed in", []);
    }

    const client = signedInState.authenticatedClient;
    if (
        previousTree !== undefined &&
        loadPostsProps.newCommentId !== undefined
    ) {
        console.log(
            `attempting to patch previous post tree with new comment ${loadPostsProps.newCommentId}`
        );
        const newCommentRequest = await client.getStatus(
            loadPostsProps.newCommentId
        );
        if (newCommentRequest.status !== 200) {
            throw new Error(
                `Failed to get new comment ${loadPostsProps.newCommentId}: ${newCommentRequest.statusText}`
            );
        }

        const newComment = newCommentRequest.data;
        const targetId = newComment.in_reply_to_id;
        const visited: string[] = [];
        let success = false;

        // Attempt to find where to attach it recursively.
        const tryAttachTo = (node: IPostTreeNode) => {
            const status = node.tryGetStatus();
            if (status !== undefined) {
                if (visited.indexOf(status.id) !== -1) {
                    throw new Error(
                        `visited the same status ${status.id} twice.`
                    );
                }

                visited.push(status.id);
                if (status.id === targetId) {
                    node.children.push(
                        new PostTreeStatusNode(newComment, [], true)
                    );
                    success = true;
                    return;
                }
            }

            for (const child of node.children) {
                tryAttachTo(child);
            }
        };

        if (targetId === null) {
            console.log(
                `the new comment ${newComment.id} did not set an id it's a reply to, this is a bug.`
            );
        }

        tryAttachTo(previousTree);

        if (!success) {
            console.log(
                `couldn't find ${targetId} to attach the new comment ${newComment.id} to. attaching it to the root...`
            );
            previousTree.children.push(
                new PostTreeStatusNode(newComment, [], true)
            );
        }

        return previousTree;
    } else {
        const postId = loadPostsProps.postId;

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

        let unsortedStatuses: Status[] = [];
        unsortedStatuses.push(...requestedStatusContext.data.ancestors);
        unsortedStatuses.push(...requestedStatusContext.data.descendants);

        let idMap: Map<string, IPostTreeNode> = new Map();

        const rootPost = locateRootNode(
            requestedStatus.data,
            idMap,
            unsortedStatuses
        );

        // Try to attach all the remaining statuses to the tree somewhere
        attachStatusesToTree(rootPost, idMap, unsortedStatuses);
        return rootPost;
    }
}

/** Locate the root status and construct a node from it. */
function locateRootNode(
    /** The status the page is for. Not necessarily the root, if it's a comment. */
    requestedStatus: Status,
    /** A map of post ids to nodes. May be modified as a side effect of this function. */
    idMap: Map<string, IPostTreeNode>,
    /** A list of statuses that have not been added to the tree yet. May be modified as a side effect. */
    unsortedStatuses: Status[]
): IPostTreeNode {
    let rootPost: IPostTreeNode = new PostTreeStatusNode(
        requestedStatus,
        [],
        true
    );
    const status = rootPost.tryGetStatus();
    if (status !== undefined) {
        idMap.set(requestedStatus.id, rootPost);

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
    return rootPost;
}

function attachStatusesToTree(
    /** The root node to attach all the others to, somehow. */
    rootNode: IPostTreeNode,
    /** A map of post ids to nodes. May be modified as a side effect of this function. */
    idMap: Map<string, IPostTreeNode>,
    /** A list of statuses that have not been added to the tree yet. May be modified as a side effect. */
    unsortedStatuses: Status[]
) {
    while (unsortedStatuses.length > 0) {
        let numAdded = 0;

        for (let i = 0; i < unsortedStatuses.length; i++) {
            const status = unsortedStatuses[i];
            if (status.in_reply_to_id === null) {
                // This is not attached to anything. Just stick it underneath the root.
                const s = new PostTreeStatusNode(status, []);
                idMap.set(status.id, s);
                rootNode.children.push(s);
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
            rootNode.children.push(statusNode);
        }
    }
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

export interface LoadPostsProps {
    postId: string;
    lastRefresh: number;
    newCommentId?: string | undefined;
}

export interface PostPageContextValue {
    loadProps: Signal<LoadPostsProps>;
}
export const PostPageContext = createContext<PostPageContextValue>();

/** A page showing a root post and nested tree of comments */
const PostPage: Component = () => {
    const params = useParams();
    const postContext: PostPageContextValue = {
        loadProps: createSignal<LoadPostsProps>({
            lastRefresh: Date.now(),
            postId: params.postId,
        }),
    };
    return (
        <PostPageContext.Provider value={postContext}>
            <ErrorBoundary
                fallback={(e) => (
                    <ErrorBox
                        error={e}
                        description="Failed to load post page"
                    />
                )}
            >
                <PostWithCommentTree />
            </ErrorBoundary>
        </PostPageContext.Provider>
    );
};

export function usePostPageContext(): PostPageContextValue {
    const value = useContext(PostPageContext);
    if (value === undefined) {
        throw new Error("usePostPageContext must be used within a provider");
    }
    return value;
}

const PostWithCommentTree: Component = () => {
    const auth = useAuth();
    const postPageContext = usePostPageContext();
    const threadInfoFetcher: ResourceFetcher<
        {
            loadProps: LoadPostsProps;
            signedInState: MaybeSignedInState;
        },
        IPostTreeNode,
        true
    > = (loadProps, { value, refetching }) =>
        fetchPostInfoTree(loadProps, value);
    const [threadInfo, mutateThreadInfo] = createResource(() => {
        return {
            loadProps: postPageContext.loadProps[0](),
            signedInState: auth.state,
        };
    }, threadInfoFetcher);
    return (
        <div class="flex flex-col md:flex-row mx-1 md:mx-4 gap-4 justify-center">
            <Show
                when={threadInfo()?.tryGetStatus() !== undefined}
                fallback={<div>Loading</div>}
            >
                <ProfileZone userInfo={threadInfo()!.tryGetStatus()!.account} />
            </Show>
            <div class="flex-grow max-w-4xl flex flex-col justify-start">
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
                                fetchShareParentDepth={5}
                            />
                            <For each={threadInfo()?.children}>
                                {(node, index) => <Comment node={node} />}
                            </For>
                            <Card class="p-4 m-4">
                                <NewCommentEditor
                                    parentStatus={
                                        threadInfo()?.tryGetStatus() as Status
                                    }
                                ></NewCommentEditor>
                            </Card>
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
