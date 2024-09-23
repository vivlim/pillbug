import { A, useParams } from "@solidjs/router";
import { Entity } from "megalodon";
import {
    createResource,
    createSignal,
    For,
    Setter,
    Show,
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

    const result = await client.getStatus(postId);
    if (result.status !== 200) {
        throw new Error(`Failed to get post ${postId}: ${result.statusText}`);
    }
    return result.data;
};

const PostPage: Component = () => {
    const authContext = useAuthContext();
    const params = useParams();
    const [postId, setPostId] = createSignal<string>(params.postId);
    const [status] = createResource(postId, (p) =>
        fetchPostInfo(authContext, p)
    );

    return (
        <>
            {status.loading && <div>loading post</div>}

            <Show when={status() !== undefined}>
                <Post
                    status={
                        status() as Status /* I don't know why this cast is necessary. todo: convince the type system correctly. */
                    }
                />
            </Show>
        </>
    );
};

export default PostPage;
