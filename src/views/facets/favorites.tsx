import {
    Component,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import { FeedComponent } from "~/components/feed";
import { FeedManifest } from "~/components/feed/feed-engine";
import { defaultHomeFeedRules } from "~/components/feed/preset-rules";
import { FavoritesFeedSource } from "~/components/feed/sources/favorites";
import { useSettings } from "~/lib/settings-manager";

export const FavoritesFacet: Component = () => {
    const feedManifest: FeedManifest = {
        source: new FavoritesFeedSource(useAuth(), useSettings()),
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
            />
        </>
    );
};

export default FavoritesFacet;