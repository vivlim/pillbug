import { A } from "@solidjs/router";
import { Entity } from "megalodon";
import {
    createResource,
    createSignal,
    For,
    Setter,
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

interface GetTimelineOptionsApi {
    local?: boolean;
    limit?: number;
    max_id?: string;
    since_id?: string;
    min_id?: string;
}

interface GetTimelineOptions extends GetTimelineOptionsApi {}

const fetchPostList = async (
    authContext: AuthProviderProps,
    timelineOptions: GetTimelineOptions,
    setPosts: Setter<Entity.Status[]>
) => {
    if (!authContext.authState.signedIn) {
        return;
    }

    const client = authContext.authState.signedIn.authenticatedClient;
    const posts: Status[] = [];
    const result = await client.getHomeTimeline(timelineOptions);
    if (result.status !== 200) {
        throw new Error(`Failed to get timeline: ${result.statusText}`);
    }
    for (const post of result.data) {
        if (post.in_reply_to_id === null) {
            posts.push(post);
        }
    }
    setPosts(posts);
};

const Feed: Component<FeedProps> = (props) => {
    const authContext = useAuthContext();
    const [pageNumber, setPageNumber] = createSignal(0);
    const [posts, setPosts] = createSignal<Array<Entity.Status>>([]);
    const [timelineOptions, setTimelineOptions] =
        createSignal<GetTimelineOptions>({ local: false, limit: 25 });
    const [postList] = createResource(timelineOptions, () =>
        fetchPostList(authContext, timelineOptions(), setPosts)
    );

    return (
        <div class="flex flex-row p-8 size-full">
            <div class="grow w-max md:w-1/2 place-self">
                <For each={posts()}>
                    {(status, index) => <Post status={status} />}
                </For>
            </div>
        </div>
    );
};

export default Feed;
