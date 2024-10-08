import { useSearchParams } from "@solidjs/router";
import { Entity, Response } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Component,
    createEffect,
    createResource,
    createSignal,
    ErrorBoundary,
    For,
} from "solid-js";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-context";
import Post from "..";
import { PageNav } from "~/components/ui/page-footer";
import { Button } from "~/components/ui/button";
import { FeedContext } from "./feed-context";

interface GetTimelineOptionsApi {
    local?: boolean;
    limit?: number;
    max_id?: string;
    since_id?: string;
    min_id?: string;
}

export interface GetTimelineOptions extends GetTimelineOptionsApi {}

type RequestHandler = (
    authContext: AuthProviderProps,
    timelineOptions: GetTimelineOptions
) => Promise<Response<Array<Status>>> | undefined;

export interface PostFeedProps {
    onRequest: RequestHandler;
    lastRefresh?: number;
}

async function fetchPostList(
    handler: RequestHandler,
    authContext: AuthProviderProps,
    timelineOptions: GetTimelineOptions
) {
    console.log(
        `fetching posts with options: ${JSON.stringify(timelineOptions)}`
    );

    const posts: Status[] = [];
    const result = await handler(authContext, timelineOptions);
    if (result == undefined) {
        console.log("Got no response from handler");
        return;
    }

    if (result.status !== 200) {
        throw new Error(`Failed to get timeline: ${result.statusText}`);
    }
    for (const post of result.data) {
        if (post.in_reply_to_id === null) {
            posts.push(post);
        }
    }
    return posts;
}

export const PostFeed: Component<PostFeedProps> = (props) => {
    const authContext = useAuthContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const [postList, listActions] = createResource(
        () => {
            return {
                local: false,
                limit: 25,
                max_id: searchParams.after,
            };
        },
        (options) => fetchPostList(props.onRequest, authContext, options)
    );

    const [lastRefresh, setLastRefresh] = createSignal(
        props.lastRefresh ?? Date.now()
    );

    createEffect(() => {
        if (props.lastRefresh != null && props.lastRefresh != lastRefresh()) {
            console.log("[PostFeed] refresh requested");
            listActions.refetch();
        }
    });

    const feedContext = {
        postList: postList,
        postListActions: listActions,
        resetFeed: () => {
            setSearchParams({ after: undefined }, { scroll: true });
            listActions.refetch();
        },
    };

    return (
        <FeedContext.Provider value={feedContext}>
            <div>
                <ErrorBoundary fallback={<div>Failed to load posts.</div>}>
                    <For each={postList()}>
                        {(status, index) => (
                            <Post status={status} fetchShareParent={false} />
                        )}
                    </For>
                    <PageNav>
                        {/* TODO: figure out how to go back reliably */}
                        <Button
                            classList={{
                                invisible: searchParams.after == undefined,
                            }}
                            disabled={true}
                        >
                            Back
                        </Button>
                        <Button
                            onClick={() => {
                                const p = postList();
                                if (p != null) {
                                    const last = p[p.length - 1];
                                    if (last != null) {
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
                    </PageNav>
                </ErrorBoundary>
            </div>
        </FeedContext.Provider>
    );
};
