import { useSearchParams } from "@solidjs/router";
import { Response } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Component,
    createEffect,
    createResource,
    createSignal,
    ErrorBoundary,
    For,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import Post from "..";
import { PageNav } from "~/components/ui/page-footer";
import { Button } from "~/components/ui/button";
import { FeedContext } from "./feed-context";
import { ErrorBox } from "~/components/error";
import { MaybeSignedInState } from "~/auth/auth-types";

interface GetTimelineOptionsApi {
    local?: boolean;
    limit?: number;
    max_id?: string;
    since_id?: string;
    min_id?: string;
}

export interface GetTimelineOptions extends GetTimelineOptionsApi {}

type RequestHandler = (
    signedInState: MaybeSignedInState,
    timelineOptions: GetTimelineOptions
) => Promise<Response<Array<Status>> | undefined> | undefined;

export interface PostFeedProps {
    onRequest: RequestHandler;
    lastRefresh?: number;
}

async function fetchPostList(
    handler: RequestHandler,
    signedInState: MaybeSignedInState,
    timelineOptions: GetTimelineOptions
) {
    console.log(
        `fetching posts with options: ${JSON.stringify(timelineOptions)}`
    );

    const posts: Status[] = [];
    const result = await handler(signedInState, timelineOptions);
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
    const auth = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [postList, listActions] = createResource(
        () => {
            return {
                signedInState: auth.state,
                options: {
                    local: false,
                    limit: 25,
                    max_id: searchParams.after,
                },
            };
        },
        (args) =>
            fetchPostList(props.onRequest, args.signedInState, args.options)
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
            <ErrorBoundary
                fallback={(e) => (
                    <ErrorBox error={e} description="Failed to load posts" />
                )}
            >
                <For each={postList()}>
                    {(status, index) => (
                        <Post status={status} fetchShareParentDepth={5} />
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
        </FeedContext.Provider>
    );
};
