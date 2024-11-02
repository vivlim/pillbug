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
    manifest: FeedManifest;
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
    const [engine, engineActions] = createResource<
        FeedEngine | undefined,
        { manifest: FeedManifest; rules: FeedRuleProperties[] },
        unknown
    >(
        () => {
            return { manifest: props.manifest, rules: props.rules };
        },
        async (args: {
            manifest: FeedManifest;
            rules: FeedRuleProperties[];
        }) => {
            console.log(
                `entering engine resource fetcher for ${args.manifest?.source.describe()}`
            );
            return new FeedEngine(args.manifest, args.rules);
        }
    );
    createEffect(() => {
        props.manifest;
        engineActions.refetch();
    });

    return (
        <ErrorBoundary
            fallback={(e) => (
                <ErrorBox error={e} description="failed to load posts" />
            )}
        >
            <Show when={engine()} fallback={"loading"}>
                <FeedComponentPostList engine={engine()!} />
            </Show>
        </ErrorBoundary>
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
    const getPosts = cache(async (page: number, engine: FeedEngine) => {
        console.log("fetching posts");
        const posts = await engine.getPosts(page, (msg) => {
            setInProgressStatusMessage(msg);
        });
        if (posts.error !== undefined) {
            console.error(`error while fetching posts: ${posts.error.message}`);
        } else {
            console.log(`successfully fetched ${posts.posts.length} posts`);
        }
        return posts;
    }, `cached-feed-${props.engine.manifest.source.describe()}` /* use the source as part of the cache key, since it should be unique */);

    const currentPage = createMemo(() => {
        return Number.parseInt(searchParams.page ?? "1");
    });
    const [posts, postsResourceActions] = createResource(
        () => currentPage(),
        async (page) => {
            console.log(`showing posts for page ${page}`);
            setInProgressStatusMessage("showing posts for page " + page);
            const p = await getPosts(page, props.engine);
            if (p.error !== undefined) {
                console.error(`error getting posts: ${p.error.message}`);
            } else {
                console.log(`posts available: ${p.posts.length}`);
            }
            return p;
        }
    );

    createEffect(() => {
        currentPage();
        postsResourceActions.refetch();
    });

    createEffect(() => {
        props.engine;
        postsResourceActions.refetch();
    });

    const [nextButtonElement, setNextButtonElement] = createSignal<Element>();
    const scrollObserver = createMemo(() => {
        return new IntersectionObserver(
            (entries, observer) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        console.log("next button has scrolled into view");
                        const nextPage = currentPage() + 1;
                        requestIdleCallback(() => {
                            getPosts(nextPage, props.engine);
                        });
                    }
                }
            },
            {
                threshold: 1.0,
            }
        );
    });
    createEffect(() => {
        if (useSettings().getPersistent().doNotPreloadNextPage) {
            return;
        }
        const e = nextButtonElement();
        if (e !== undefined) {
            scrollObserver().observe(e);
        }
    });

    return (
        <ErrorBoundary
            fallback={(e) => (
                <ErrorBox error={e} description="Failed to load posts" />
            )}
        >
            <Switch>
                <Match when={!posts.loading}>
                    <Show when={posts()?.error !== undefined}>
                        <div>
                            Error while fetching post: {posts()?.error?.message}
                            . Posts may be missing.
                        </div>
                    </Show>
                    <For each={posts()?.posts}>
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

                    <Show when={props.engine.manifest.postsPerPage !== null}>
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
                                ref={setNextButtonElement}
                            >
                                Next ({currentPage() + 1})
                            </Button>
                        </PageNav>
                    </Show>
                </Match>
            </Switch>
            <Show when={settings.getPersistent().enableDevTools}>
                <div class="debugStatusMessage">
                    {inProgressStatusMessage()}
                </div>
            </Show>
        </ErrorBoundary>
    );
};
