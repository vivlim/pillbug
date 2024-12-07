import { stat } from "fs";
import { DateTime } from "luxon";
import { MegalodonInterface } from "megalodon";
import { Account } from "megalodon/lib/src/entities/account";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Component,
    createEffect,
    createMemo,
    createResource,
    createSignal,
    For,
    Match,
    onCleanup,
    onMount,
    Show,
    Suspense,
    Switch,
} from "solid-js";
import { createStore } from "solid-js/store";
import { useAuth } from "~/auth/auth-manager";
import { Timestamp } from "~/components/post/timestamp";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { LoggedRequest, unwrapLoggedResponseAsync } from "~/lib/clientUtil";
import { SingleLinePostPreviewLink } from "./notifications";
import { Checkbox } from "~/components/checkbox";
import { A, useParams } from "@solidjs/router";
import { HtmlSandboxSpan } from "../htmlsandbox";
import { AvatarLink } from "~/components/user/avatar";
import { useSettings } from "~/lib/settings-manager";
import { useFrameContext } from "~/components/frame/context";
import { LayoutLeftColumnPortal } from "~/components/layout/columns";
import "./following.css";
import { PostFeed } from "~/components/post/feed";
import { fetchUserInfo, GetAccountFeedOptions } from "../userprofile";
import {
    defaultFeedRules,
    defaultHomeFeedRules,
} from "~/components/feed/preset-rules";
import { FeedComponent } from "~/components/feed";
import { FeedManifest } from "~/components/feed/feed-engine";
import { UserFeedSource } from "~/components/feed/sources/userfeed";
import { logger } from "~/logging";
import { useAccountStore } from "~/lib/following-accounts-store";

interface AccountInfo {
    acct: string;
    account: Account;
    lastKnownStatus: Status | undefined;
    lastKnownStatusTs: DateTime;
    lastKnownStatusUnixTs: number;
    isFollowed: boolean | undefined;
}

type AccountInfoMap = {
    [acct: string]: AccountInfo;
};

type FollowingFacetStore = {
    requestList: LoggedRequest[];
    lastHomeTimelinePostId: string | undefined;
    numberOfPostsScanned: number;
    remainingTimelinePulls: number;
    showAccountsWithUnknownLastPost?: boolean;
    followingAccountCount: number;
    hideGetMoreButtons: boolean;
};

const FollowingFacet: Component = () => {
    const settings = useSettings();

    const params = useParams();
    const username = createMemo(() => params.username);

    // Hide the nav if a profile is visible - the profile replaces it
    const frameContext = useFrameContext();
    onMount(() => {
        frameContext.setNoColumns(true);
        frameContext.setShowNav(false);
        document.documentElement.classList.add("followingFacet");
    });
    onCleanup(() => {
        frameContext.setNoColumns(false);
        frameContext.setShowNav(true);
        document.documentElement.classList.remove("followingFacet");
    });

    const auth = useAuth();
    const accountStore = useAccountStore();
    auth.assumeSignedIn; // throws if not
    const [facetStore, setFacetStore] = createStore<FollowingFacetStore>({
        requestList: [],
        lastHomeTimelinePostId: undefined,
        remainingTimelinePulls: 4,
        numberOfPostsScanned: 0,
        followingAccountCount: -1,
        hideGetMoreButtons: false,
    });

    const [numAccountsRequested, setNumAccountsRequested] =
        createSignal<number>(20);

    const sortedAccounts = createMemo(() => {
        const accounts: AccountInfo[] = Object.values(accountStore.store);
        accounts.sort((a, b) => {
            // descending order
            return b.lastKnownStatusUnixTs - a.lastKnownStatusUnixTs;
        });
        return accounts;
    });

    const sortedAccountsWithKnownLastPosts = createMemo(() => {
        return sortedAccounts().filter(
            (a) => a.lastKnownStatus !== undefined && a.isFollowed
        );
    });

    const filteredSortedAccounts = createMemo(() => {
        if (!facetStore.showAccountsWithUnknownLastPost) {
            return sortedAccountsWithKnownLastPosts();
        }

        return sortedAccounts().filter((a) => a.isFollowed);
    });

    const missingAccounts = createMemo(() => {
        const accounts: AccountInfo[] = Object.values(accountStore.store);
        return accounts.filter(
            (a) => a.isFollowed && a.lastKnownStatus === undefined
        );
    });

    const accountGapCount = createMemo(() => {
        return (
            numAccountsRequested() - sortedAccountsWithKnownLastPosts().length
        );
    });

    const requestLogger = (lr: LoggedRequest) => {
        setFacetStore("requestList", facetStore.requestList.length, lr);
    };

    // if you've checked all the accounts, we should show the ones that haven't posted.
    createEffect(() => {
        if (
            facetStore.followingAccountCount > 0 &&
            sortedAccountsWithKnownLastPosts().length > 0 &&
            missingAccounts().length === 0 &&
            !facetStore.showAccountsWithUnknownLastPost
        ) {
            setFacetStore("showAccountsWithUnknownLastPost", true);
            setFacetStore("hideGetMoreButtons", true);
        }
    });

    const discoverySink: DiscoverySink = async (
        acct: string,
        account: Account | undefined,
        lastKnownStatus: Status | undefined,
        /** whether we're following the user. this may be undefined if that isn't known cheaply, so we can make that request a single time */
        isFollowed: boolean | undefined
    ) => {
        if (lastKnownStatus !== undefined && account === undefined) {
            account = lastKnownStatus.account;
        }

        if (lastKnownStatus !== undefined) {
            setFacetStore(
                "numberOfPostsScanned",
                facetStore.numberOfPostsScanned + 1
            );

            // ignore boosts
            if (lastKnownStatus.reblog !== null) {
                return;
            }

            // and replies, for consistency with the feed we show currently.
            if (lastKnownStatus.in_reply_to_id !== null) {
                return;
            }
        }

        const currentRecord = accountStore.store[acct];
        if (currentRecord === undefined) {
            const { dt, unix } = parseStatusDateTimeUnixTs(lastKnownStatus);
            accountStore.setStore(acct, {
                acct: acct,
                account: account,
                lastKnownStatus: lastKnownStatus,
                lastKnownStatusTs: dt,
                lastKnownStatusUnixTs: unix,
                isFollowed: isFollowed,
            });
        } else if (
            currentRecord.lastKnownStatus === undefined &&
            lastKnownStatus !== undefined
        ) {
            if (isFollowed === undefined) {
                // this could also be undefined
                isFollowed = currentRecord.isFollowed;
            }
            const { dt, unix } = parseStatusDateTimeUnixTs(lastKnownStatus);
            accountStore.setStore(acct, {
                ...currentRecord,
                lastKnownStatus: lastKnownStatus,
                lastKnownStatusTs: dt,
                lastKnownStatusUnixTs: unix,
                isFollowed: currentRecord.isFollowed,
            });
        }
    };

    const followingList = async () => {
        const accounts: Account[] = await unwrapLoggedResponseAsync(
            auth.assumeSignedIn.client.getAccountFollowing(
                auth.assumeSignedIn.state.accountData.id,
                { get_all: true, sleep_ms: 10 }
            ),
            "getting list of accounts you follow",
            "need to have the full list available for cross referencing",
            (x) => `got ${x.length} accounts`,
            requestLogger
        );
        setFacetStore("followingAccountCount", accounts.length);

        for (const account of accounts) {
            discoverySink(account.acct, account, undefined, true);
        }
    };

    const dataFetcher = async () => {
        if (accountGapCount() <= 0) {
            // no action needed - we have the needed number of accounts
            return;
        }

        // Start by grabbing home timeline posts and seeing how many more accounts we need.
        const lastPostId = await ingestHomeTimeline(
            auth.assumeSignedIn.client,
            discoverySink,
            { limit: 50, max_id: facetStore.lastHomeTimelinePostId },
            `trying to collect ${accountGapCount()} more accounts from home timeline (have ${
                sortedAccountsWithKnownLastPosts().length
            })`,
            requestLogger
        );
        setFacetStore("lastHomeTimelinePostId", lastPostId);
    };

    const randomFollowerLookup = async (count: number) => {
        if (accountGapCount() <= 0) {
            // no action needed - we have the needed number of accounts
            return;
        }
        const accounts = missingAccounts();
        if (accounts.length === 0) {
            if (!facetStore.hideGetMoreButtons) {
                setFacetStore("hideGetMoreButtons", true);
            }
            return;
        }

        const selection = [];

        for (let i = 0; i < count; i++) {
            selection.push(
                accounts.splice(
                    Math.floor(Math.random() * accounts.length),
                    1
                )[0]
            );
        }
        for (let a of selection) {
            const lastPost: Status[] = await unwrapLoggedResponseAsync(
                auth.assumeSignedIn.client.getAccountStatuses(a.account.id, {
                    limit: 1,
                    pinned: false,
                    exclude_replies: true,
                    exclude_reblogs: true,
                }),
                `getting ${a.acct}'s most recent post`,
                "randomly selected account without a known last post",
                (x) => {
                    if (x.length === 0) {
                        return "no post";
                    }
                    return `found post from ${x[0].created_at}`;
                },
                requestLogger
            );
            await discoverySink(a.acct, a.account, lastPost[0], a.isFollowed);
        }
    };

    const expandWindowOnInteraction = (count: number) => {
        // increase the window because the user is clicking
        if (accountGapCount() <= count) {
            setNumAccountsRequested(numAccountsRequested() + count);
        }
    };

    // stuff to do on first load
    const init = async () => {
        await followingList();
        await dataFetcher();
    };
    init();

    let numAccountsInput: HTMLInputElement;

    return (
        <div id="following-root">
            <div class="following-user-list">
                <ul>
                    <For each={filteredSortedAccounts()}>
                        {(acct, idx) => {
                            return <FollowingUser acct={acct} />;
                        }}
                    </For>
                </ul>

                <Switch>
                    <Match when={facetStore.followingAccountCount < 0}>
                        loading account list
                    </Match>
                    <Match when={!facetStore.hideGetMoreButtons}>
                        <div>
                            {sortedAccountsWithKnownLastPosts().length}/
                            {facetStore.followingAccountCount} accounts you're
                            following have known last posts. choose how to
                            continue:
                        </div>
                        <Button
                            class="followingFetchButton"
                            onClick={() => {
                                expandWindowOnInteraction(8);
                                setNumAccountsRequested(
                                    numAccountsInput!.valueAsNumber
                                );
                                dataFetcher();
                            }}
                        >
                            look further back in timeline
                        </Button>
                        <Button
                            class="followingFetchButton"
                            onClick={() => {
                                expandWindowOnInteraction(7);
                                randomFollowerLookup(7);
                            }}
                        >
                            randomly check some accounts you follow
                        </Button>
                    </Match>
                    <Match when={facetStore.hideGetMoreButtons}>
                        all of the {facetStore.followingAccountCount} accounts
                        you're following are here.
                    </Match>
                </Switch>
            </div>

            <div class="following-posts">
                <div class="p-4 m-2">
                    <Show when={username() !== undefined}>
                        <FollowingUserPosts acct={username()} />
                    </Show>
                    <Show when={settings.persistentStore.enableDevTools}>
                        <details>
                            <summary>dev controls</summary>
                            <ul>
                                <li>
                                    current number of accounts with known last
                                    posts:{" "}
                                    {sortedAccountsWithKnownLastPosts().length}.
                                </li>
                                <li>
                                    desired number of accounts:
                                    <input
                                        type="number"
                                        ref={numAccountsInput!}
                                        value={numAccountsRequested()}
                                        class="pbInput"
                                    />
                                </li>
                                <li>gap: {accountGapCount()} accounts</li>
                                <li>
                                    <Button
                                        onClick={() => {
                                            setNumAccountsRequested(
                                                numAccountsInput!.valueAsNumber
                                            );
                                            dataFetcher();
                                        }}
                                    >
                                        fetch posts by going back in the
                                        timeline
                                    </Button>
                                </li>
                                <li>
                                    of known following accounts,{" "}
                                    {missingAccounts().length} have unknown last
                                    posts.
                                </li>
                                <li>
                                    <Button
                                        onClick={() => {
                                            randomFollowerLookup(5);
                                        }}
                                    >
                                        randomly sample followed accounts
                                    </Button>
                                </li>
                                <li>
                                    {facetStore.numberOfPostsScanned} posts
                                    scanned total
                                </li>
                                <li>
                                    <Checkbox
                                        id="showWithUnknownLastPost"
                                        getter={() =>
                                            facetStore.showAccountsWithUnknownLastPost ??
                                            false
                                        }
                                        setter={(v: boolean) =>
                                            setFacetStore(
                                                "showAccountsWithUnknownLastPost",
                                                v
                                            )
                                        }
                                    >
                                        show accounts with unknown last post
                                    </Checkbox>
                                </li>
                            </ul>
                        </details>
                        <hr />
                        <details>
                            <summary>
                                api request log ({facetStore.requestList.length}
                                )
                            </summary>
                            <ul>
                                <For each={facetStore.requestList}>
                                    {(req, idx) => {
                                        return (
                                            <li>
                                                {req.success ? "✅" : "❌"}
                                                <Timestamp ts={req.ts} />:{" "}
                                                {req.requestLabel}
                                                <ul>
                                                    <li>
                                                        took{" "}
                                                        {req.duration.toHuman()}
                                                    </li>
                                                    <li>why: {req.whyLabel}</li>
                                                    <Show
                                                        when={
                                                            req.responseLabel !==
                                                            undefined
                                                        }
                                                    >
                                                        <li>
                                                            result:{" "}
                                                            {req.responseLabel}
                                                        </li>
                                                    </Show>
                                                    <Show when={!req.success}>
                                                        <li>
                                                            {req.error?.message}
                                                        </li>
                                                    </Show>
                                                </ul>
                                            </li>
                                        );
                                    }}
                                </For>
                            </ul>
                        </details>
                    </Show>
                </div>
            </div>
        </div>
    );
};

type FollowingUserProps = {
    acct: AccountInfo;
};
const FollowingUser: Component<FollowingUserProps> = ({ acct }) => {
    const userHref = `/following/${acct.acct}`;
    return (
        <li class="flex flex-initial pbCard my-2 following-user">
            <a
                class="flex flex-row block w-full p-3 border-2 border-transparent hoverAccentBorder rounded-xl"
                href={userHref}
            >
                <AvatarLink
                    user={acct.account}
                    imgClass="size-8"
                    class="inline-block"
                />
                <div class="ml-3 following-user-info">
                    <Show
                        when={acct.lastKnownStatus !== undefined}
                        fallback={acct.acct}
                    >
                        <div class="following-user-and-ts">
                            <p class="username">{acct.acct}</p>
                            <p class="timestamp">
                                <Timestamp
                                    ts={acct.lastKnownStatusTs}
                                ></Timestamp>
                            </p>
                        </div>
                        <Show
                            when={
                                !acct.lastKnownStatus?.sensitive &&
                                acct.lastKnownStatus?.spoiler_text === ""
                            }
                        >
                            <p class="pbSingleLineBlock">
                                <HtmlSandboxSpan
                                    html={acct.lastKnownStatus?.content ?? ""}
                                    emoji={acct.lastKnownStatus?.emojis}
                                />
                            </p>
                        </Show>
                    </Show>
                </div>
            </a>
        </li>
    );
};

const FollowingUserPosts: Component<{ acct: string }> = (props) => {
    const auth = useAuth();
    const settings = useSettings();
    const [userFeedManifest, userFeedManifestActions] =
        createResource<FeedManifest>(async () => {
            const targetUser = await fetchUserInfo(
                auth.assumeSignedIn.state,
                props.acct
            );
            if (targetUser?.id === undefined) {
                logger.error(`user ${props.acct} doesn't exist?`);
                throw new Error(`user ${props.acct} doesn't exist?`);
            }

            return {
                source: new UserFeedSource(
                    auth,
                    settings,
                    targetUser.id,
                    targetUser.acct
                ),
                fetchReferencedPosts: 5,
                postsPerPage: 10,
                postsToFetchPerBatch: 10,
            };
        });
    createEffect(() => {
        props.acct;
        userFeedManifestActions.refetch();
    });

    return (
        <Switch>
            <Match
                when={
                    userFeedManifest.state === "ready" &&
                    userFeedManifest() !== undefined
                }
            >
                <FeedComponent
                    manifest={userFeedManifest()!}
                    rules={defaultHomeFeedRules}
                    initialOptions={{ limit: 25 }}
                />
            </Match>
            <Match when={userFeedManifest.state === "errored"}>
                failed to load user posts
            </Match>
            <Match when={true}>loading...</Match>
        </Switch>
    );
};

type DiscoverySink = (
    acct: string,
    account: Account | undefined,
    lastKnownStatus: Status | undefined,
    /** whether we're following the user. this may be undefined if that isn't known cheaply, so we can make that request a single time */
    isFollowed: boolean | undefined
) => Promise<void>;

/** Collect some home timeline posts and feed them into the discovery sink. Returns the last seen post id (which could be used in subsequent calls) */
async function ingestHomeTimeline(
    client: MegalodonInterface,
    discoverySink: DiscoverySink,
    options: {
        local?: boolean;
        limit: number;
        max_id?: string;
        since_id?: string;
        min_id?: string;
    },
    whyLabel: string,
    logger: (lr: LoggedRequest) => void
): Promise<string | undefined> {
    const temporalLabel = options.max_id ? `before ${options.max_id}` : "";

    const result: Status[] = await unwrapLoggedResponseAsync(
        client.getHomeTimeline(options),
        `request ${options.limit} posts ${temporalLabel}`,
        whyLabel,
        (x) => {
            let lastLabel = "";
            if (x.length > 0) {
                const last = x[x.length - 1];
                lastLabel = `last @ ${last.created_at} by ${last.account.acct}`;
            }
            return `got ${x.length} statuses ${lastLabel}`;
        },
        logger
    );
    let lastId;
    for (const status of result) {
        await discoverySink(
            status.account.acct,
            status.account,
            status,
            undefined
        );
        lastId = status.id;
    }

    return lastId;
}

function parseStatusDateTimeUnixTs(status: Status | undefined): {
    dt: DateTime | undefined;
    unix: number;
} {
    if (status === undefined) {
        return { dt: undefined, unix: 0 };
    }
    const result = DateTime.fromISO(status.created_at);
    if (!result.isValid) {
        logger.info(
            `datetime '${status.created_at}' invalid for ${status.id}: ${result.invalidReason}`
        );
        return { dt: undefined, unix: 0 };
    }
    return { dt: result, unix: result.toUnixInteger() };
}

export default FollowingFacet;
