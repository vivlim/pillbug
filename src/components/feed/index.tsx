import {
    Accessor,
    Component,
    ErrorBoundary,
    For,
    Setter,
    Show,
    createContext,
    createEffect,
    createMemo,
    createResource,
    createSignal,
    useContext,
} from "solid-js";
import { GetTimelineOptions, RequestHandler } from "../post/feed";
import { FeedEngine, FeedManifest, FeedRuleProperties } from "./feed-engine";
import { StoreBacked } from "~/lib/store-backed";
import { Status } from "megalodon/lib/src/entities/status";
import { Response } from "megalodon";
import { useAuth } from "~/auth/auth-manager";
import { unwrapResponse } from "~/lib/clientUtil";
import ErrorBox from "../error";
import Post from "../post";
import { HomeFeedSource } from "./sources/homefeed";
import { PreprocessedPost } from "../post/preprocessed";

export type FeedComponentProps = {
    onRequest: (options: GetTimelineOptions) => Promise<Response<Status[]>>;
    rules: FeedRuleProperties[];
    initialOptions: GetTimelineOptions;
};

interface FeedComponentStore {
    options: GetTimelineOptions;
}

interface FeedComponentContext extends FeedComponentProps {
    engine: FeedEngine;
    store: StoreBacked<FeedComponentStore>;
}

// Really need to come up with some convention for naming these.
const FeedComponentContextCtx = createContext<FeedComponentContext>();

export const FeedComponent: Component<FeedComponentProps> = (props) => {
    const engine: Accessor<FeedEngine> = createMemo(() => {
        console.log("new engine");
        const manifest: FeedManifest = {
            source: new HomeFeedSource(useAuth()),
            fetchReferencedPosts: 5, // unused??
            postsPerPage: 20,
            postsToFetchPerBatch: 40,
        };
        return new FeedEngine(manifest, props.rules);
    });

    const store = new StoreBacked<FeedComponentStore>({
        options: props.initialOptions,
    });

    return (
        <FeedComponentContextCtx.Provider
            value={{ ...props, engine: engine(), store }}
        >
            <FeedComponentPostList engine={engine} />
        </FeedComponentContextCtx.Provider>
    );
};

function useFeed(): FeedComponentContext {
    const value = useContext(FeedComponentContextCtx);
    if (value === undefined) {
        throw new Error(
            "Feed context must be used within the feed that created it (a new version of pillbug may have been deployed; try refreshing)"
        );
    }
    return value;
}

export const FeedComponentPostList: Component<{
    engine: Accessor<FeedEngine>;
}> = (props) => {
    const feed = useFeed();
    const auth = useAuth();
    const client = auth.assumeSignedIn.client;
    const [posts, postsResourceActions] = createResource(async () => {
        // todo: paginate
        props.engine();
        console.log("fetching posts");
        const posts = await props.engine().getPosts(1);
        console.log(`successfully fetched ${posts.length} posts`);
        return posts;
    });

    createEffect(() => {
        props.engine();
        postsResourceActions.refetch();
    });

    return (
        <ErrorBoundary
            fallback={(e) => (
                <ErrorBox error={e} description="Failed to load posts" />
            )}
        >
            <For each={posts()}>
                {(status, index) => (
                    <>
                        <Show when={!status.hide}>
                            <PreprocessedPost
                                status={status}
                                limitInitialHeight={true}
                            />
                        </Show>
                    </>
                )}
            </For>
        </ErrorBoundary>
    );
};
