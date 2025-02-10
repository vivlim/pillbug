import { useLocation } from "@solidjs/router";
import {
    createEffect,
    createMemo,
    createSignal,
    Show,
    type Component,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import { FeedComponent } from "~/components/feed";
import { FeedManifest } from "~/components/feed/feed-engine";
import { defaultHomeFeedRules } from "~/components/feed/preset-rules";
import { HomeFeedSource } from "~/components/feed/sources/homefeed";
import { PostFeed } from "~/components/post/feed";
import { useSettings } from "~/lib/settings-manager";
import { logger } from "~/logging";
import { ShowIfInstance } from "~/website-league/showIfInstance";
import { WebsiteLeagueBroadcast } from "~/website-league/websiteLeagueBroadcast";

export interface SubmitFeedState {
    new_id: string;
}

const Feed: Component = () => {
    const location = useLocation<SubmitFeedState>();
    const auth = useAuth();

    const [lastRefresh, setLastRefresh] = createSignal(Date.now());
    const [feedLoaded, setFeedLoaded] = createSignal(false);

    createEffect(() => {
        if (location.state?.new_id != null) {
            setLastRefresh(Date.now());
        }
    });
    const manifest = createMemo<FeedManifest>(() => {
        logger.info("creating manifest");
        setFeedLoaded(false);
        return {
            source: new HomeFeedSource(useAuth(), useSettings()),
            fetchReferencedPosts: 5,
            postsPerPage: 10,
            postsToFetchPerBatch: 40,
        };
    });

    return (
        <>
            <Show
                when={auth.store.accountIsSwitching === false}
                fallback={<div>please wait...</div>}
            >
                <FeedComponent
                    manifest={manifest()}
                    rules={defaultHomeFeedRules}
                    initialOptions={{ limit: 25 }}
                    onLoaded={() => setFeedLoaded(true)}
                />
                <ShowIfInstance in="Website League" when={feedLoaded()}>
                    <WebsiteLeagueBroadcast />
                </ShowIfInstance>
            </Show>
        </>
    );
};

export default Feed;
