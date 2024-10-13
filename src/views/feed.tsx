import { useLocation } from "@solidjs/router";
import { createEffect, createSignal, type Component } from "solid-js";
import { PostFeed } from "~/components/post/feed";

export interface SubmitFeedState {
    new_id: string;
}

const Feed: Component = () => {
    const location = useLocation<SubmitFeedState>();

    const [lastRefresh, setLastRefresh] = createSignal(Date.now());

    createEffect(() => {
        if (location.state?.new_id != null) {
            setLastRefresh(Date.now());
        }
    });

    return (
        <PostFeed
            onRequest={async (signedInState, timelineOptions) => {
                if (signedInState?.signedIn) {
                    return await signedInState.authenticatedClient.getHomeTimeline(
                        timelineOptions
                    );
                }
                return undefined;
            }}
            lastRefresh={lastRefresh()}
        />
    );
};

export default Feed;
