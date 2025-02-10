import {
    Component,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import { FeedComponent } from "~/components/feed";
import { FeedManifest } from "~/components/feed/feed-engine";
import { defaultHomeFeedRules } from "~/components/feed/preset-rules";
import { BookmarksFeedSource } from "~/components/feed/sources/bookmarks";
import { useSettings } from "~/lib/settings-manager";

export const BookmarksFacet: Component = () => {
    const feedManifest: FeedManifest = {
        source: new BookmarksFeedSource(useAuth(), useSettings()),
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

export default BookmarksFacet;