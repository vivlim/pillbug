import {
    Accessor,
    Component,
    ErrorBoundary,
    For,
    Match,
    Setter,
    Show,
    Switch,
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
import { Button } from "../ui/button";
import { cache, useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";
import { PageNav } from "../ui/page-footer";
import { useSettings } from "~/lib/settings-manager";

export type FeedComponentProps = {
    rules: FeedRuleProperties[];
    initialOptions: GetTimelineOptions;
    manifest?: FeedManifest;
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
    const [engine, engineActions] = createResource<FeedEngine>(async () => {
        console.log("new engine");
        const manifest: FeedManifest = props.manifest ?? {
            source: new HomeFeedSource(useAuth()),
            fetchReferencedPosts: 5, // unused??
            postsPerPage: 10,
            postsToFetchPerBatch: 40,
        };
        return new FeedEngine(manifest, props.rules);
    });

    return (
        <Show when={engine()} fallback={"initializing"}>
            <FeedComponentPostList engine={engine()!} />
        </Show>
    );
};

export const FeedComponentPostList: Component<{
    engine: FeedEngine;
}> = (props) => {
    if (props.engine === undefined) {
        throw new Error("engine is not initialized");
    }
    const settings = useSettings();
    const [searchParams, setSearchParams] = useSearchParams();
    const [inProgressStatusMessage, setInProgressStatusMessage] = createSignal<
        string | undefined
    >();
    const auth = useAuth();
    const client = auth.assumeSignedIn.client;
    const getPosts = cache(async (num) => {
        console.log("fetching posts");
        const posts = await props.engine.getPosts(num, (msg) => {
            setInProgressStatusMessage(msg);
        });
        console.log(`successfully fetched ${posts.length} posts`);
        return posts;
    }, `cached-feed-${props.engine.manifest.source.describe()}` /* use the source as part of the cache key, since it should be unique */);

    const currentPage = createMemo(() => {
        return Number.parseInt(searchParams.page ?? "1");
    });
    const [posts, postsResourceActions] = createResource(async () => {
        console.log("showing posts for page " + currentPage());
        setInProgressStatusMessage("showing posts for page " + currentPage());
        return await getPosts(currentPage());
    });

    createEffect(() => {
        currentPage();
        postsResourceActions.refetch();
    });

    createEffect(() => {
        props.engine;
        postsResourceActions.refetch();
    });

    return (
        <ErrorBoundary
            fallback={(e) => (
                <ErrorBox error={e} description="Failed to load posts" />
            )}
        >
            <Show when={settings.getPersistent().enableDevTools}>
                <div>{inProgressStatusMessage()}</div>
            </Show>
            <Switch>
                <Match when={posts.state === "ready"}>
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

                    <PageNav>
                        <Button
                            classList={{
                                invisible: currentPage() === 1,
                            }}
                            onClick={() => {
                                setSearchParams(
                                    { page: currentPage() - 1 },
                                    { scroll: true }
                                );
                            }}
                        >
                            Back ({currentPage() - 1})
                        </Button>
                        <Button
                            onClick={() => {
                                setSearchParams(
                                    { page: currentPage() + 1 },
                                    { scroll: true }
                                );
                            }}
                        >
                            Next ({currentPage() + 1})
                        </Button>
                    </PageNav>
                </Match>
            </Switch>
        </ErrorBoundary>
    );
};
