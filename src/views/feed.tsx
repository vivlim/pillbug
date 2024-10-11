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
            onRequest={async (auth, timelineOptions) => {
                if (auth.signedIn) {
                    return await auth.assumeSignedIn.client.getHomeTimeline(
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
