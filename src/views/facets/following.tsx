import { stat } from "fs";
import { DateTime } from "luxon";
import { MegalodonInterface } from "megalodon";
import { Account } from "megalodon/lib/src/entities/account";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Component,
    createMemo,
    createResource,
    createSignal,
    For,
    onCleanup,
    onMount,
    Show,
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
import { A } from "@solidjs/router";
import { HtmlSandboxSpan } from "../htmlsandbox";
import { AvatarLink } from "~/components/user/avatar";
import { useSettings } from "~/lib/settings-manager";
import { useFrameContext } from "~/components/frame/context";
import {
    LayoutLeftColumnPortal,
    LayoutOutsideGridPortal,
} from "~/components/layout/columns";
import "./following.css";

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
};

const FollowingFacet: Component = () => {
    const settings = useSettings();
    if (!settings.getPersistent().enableDevTools) {
        throw new Error("this view is only available if dev tools are enabled");
    }

    // Hide the nav if a profile is visible - the profile replaces it
    const frameContext = useFrameContext();
    onMount(() => {
        frameContext.setShowNav(false);
    });
    onCleanup(() => {
        frameContext.setShowNav(true);
    });

    const auth = useAuth();
    auth.assumeSignedIn; // throws if not
    const [accountStore, setAccountStore] = createStore<AccountInfoMap>({});
    const [facetStore, setFacetStore] = createStore<FollowingFacetStore>({
        requestList: [],
        lastHomeTimelinePostId: undefined,
        remainingTimelinePulls: 4,
        numberOfPostsScanned: 0,
    });

    const [numAccountsRequested, setNumAccountsRequested] =
        createSignal<number>(20);

    const sortedAccounts = createMemo(() => {
        const accounts: AccountInfo[] = Object.values(accountStore);
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
        const accounts: AccountInfo[] = Object.values(accountStore);
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
        }

        const currentRecord = accountStore[acct];
        if (currentRecord === undefined) {
            const { dt, unix } = parseStatusDateTimeUnixTs(lastKnownStatus);
            setAccountStore(acct, {
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
            setAccountStore(acct, {
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
                { limit: 80 }
            ),
            "getting list of accounts you follow",
            "need to have the full list available for cross referencing",
            (x) => `got ${x.length} accounts`,
            requestLogger
        );

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

    const randomFollowerLookup = async () => {
        if (accountGapCount() <= 0) {
            // no action needed - we have the needed number of accounts
            return;
        }
        const accounts = missingAccounts();
        if (accounts.length === 0) {
            return;
        }

        const selection = [];

        for (let i = 0; i < 5; i++) {
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

    // stuff to do on first load
    const init = async () => {
        await followingList();
        await dataFetcher();
    };
    init();

    let numAccountsInput: HTMLInputElement;

    return (
        <LayoutOutsideGridPortal>
            <div id="following-root">
                <div class="spacer" />
                <div class="following-user-list">
                    <ul>
                        <For each={filteredSortedAccounts()}>
                            {(acct, idx) => {
                                return <FollowingUser acct={acct} />;
                            }}
                        </For>
                    </ul>
                </div>

                <div class="following-posts">
                    <div class="pbCard p-4 m-2">
                        <p>
                            hi! this is a *super* rough early 'following' view.
                            you can make it manually fetch posts by pushing the
                            buttons below.
                        </p>
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
                                    fetch posts by going back in the timeline
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
                                        randomFollowerLookup();
                                    }}
                                >
                                    randomly sample followed accounts
                                </Button>
                            </li>
                            <li>
                                {facetStore.numberOfPostsScanned} posts scanned
                                total
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
                    </div>
                </div>

                <div class="spacer" />
            </div>
        </LayoutOutsideGridPortal>
    );
};

type FollowingUserProps = {
    acct: AccountInfo;
};
const FollowingUser: Component<FollowingUserProps> = ({ acct }) => {
    const userHref = `/user/${acct.acct}`;
    return (
        <li class="flex flex-initial pbCard my-2 following-user">
            <A
                class="flex flex-row block w-full p-3 border-2 border-transparent hover:border-fuchsia-900 rounded-xl"
                href={userHref}
                target="_blank"
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
            </A>
        </li>
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
        console.log(
            `datetime '${status.created_at}' invalid for ${status.id}: ${result.invalidReason}`
        );
        return { dt: undefined, unix: 0 };
    }
    return { dt: result, unix: result.toUnixInteger() };
}

export default FollowingFacet;
