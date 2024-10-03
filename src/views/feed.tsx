import {
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "@solidjs/router";
import { Entity } from "megalodon";
import {
    createEffect,
    createResource,
    createSignal,
    ErrorBoundary,
    For,
    Setter,
    type Component,
} from "solid-js";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import Post from "./post";
import { Status } from "megalodon/lib/src/entities/status";

export interface SubmitFeedState {
    new_id: string;
}

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
    timelineOptions: GetTimelineOptions
) => {
    console.log(
        `fetching posts with options: ${JSON.stringify(timelineOptions)}`
    );
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
    return posts;
};

const Feed: Component = () => {
    const authContext = useAuthContext();
    const location = useLocation<SubmitFeedState>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [postList, { mutate, refetch }] = createResource(
        () => {
            return {
                local: false,
                limit: 25,
                max_id: searchParams.after,
            };
        }, // If this returns null or undefined, resource won't be loaded.
        (options) => fetchPostList(authContext, options)
    );
    createEffect(() => {
        if (location.state?.new_id) {
            console.log("new_id updated! updating search params");
            setSearchParams({ after: null }, { scroll: true });
            refetch();
        }
    });

    return (
        <>
            <div class="flex flex-row p-8 size-full">
                <ErrorBoundary fallback={<div>ouch!</div>}>
                    <div class="grow w-max md:w-1/2 place-self">
                        <For each={postList()}>
                            {(status, index) => (
                                <Post
                                    status={status}
                                    fetchShareParent={false}
                                />
                            )}
                        </For>
                    </div>
                </ErrorBoundary>
            </div>
            <div>
                <div class="flex flex-row w-100 m-8">
                    <div class="grow"></div>
                    <Button
                        class="grow-0"
                        onClick={() => {
                            let p = postList();
                            if (p !== undefined) {
                                let last = p[p.length - 1];
                                if (last !== undefined) {
                                    setSearchParams(
                                        { after: last.id },
                                        { scroll: true }
                                    );
                                }
                            }
                        }}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </>
    );
};

export default Feed;
