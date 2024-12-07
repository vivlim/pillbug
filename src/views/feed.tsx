import { useLocation } from "@solidjs/router";
import { createEffect, createSignal, type Component } from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import { FeedComponent } from "~/components/feed";
import { FeedManifest } from "~/components/feed/feed-engine";
import { defaultHomeFeedRules } from "~/components/feed/preset-rules";
import { HomeFeedSource } from "~/components/feed/sources/homefeed";
import { PostFeed } from "~/components/post/feed";
import { useSettings } from "~/lib/settings-manager";
import { ShowIfInstance } from "~/website-league/showIfInstance";
import { WebsiteLeagueBroadcast } from "~/website-league/websiteLeagueBroadcast";

export interface SubmitFeedState {
    new_id: string;
}

const Feed: Component = () => {
    const location = useLocation<SubmitFeedState>();

    const [lastRefresh, setLastRefresh] = createSignal(Date.now());
    const [feedLoaded, setFeedLoaded] = createSignal(false);

    createEffect(() => {
        if (location.state?.new_id != null) {
            setLastRefresh(Date.now());
        }
    });
    const feedManifest: FeedManifest = {
        source: new HomeFeedSource(useAuth(), useSettings()),
        fetchReferencedPosts: 5,
        postsPerPage: 10,
        postsToFetchPerBatch: 40,
    };

    return (
        <>
            <FeedComponent
                manifest={feedManifest}
                rules={defaultHomeFeedRules}
                initialOptions={{ limit: 25 }}
                onLoaded={() => setFeedLoaded(true)}
            />
            <ShowIfInstance in="Website League" when={feedLoaded()}>
                <WebsiteLeagueBroadcast />
            </ShowIfInstance>
        </>
    );
};

export default Feed;
