import { DateTime, Duration } from "luxon";
import { MegalodonInterface } from "megalodon";
import { Instance } from "megalodon/lib/src/entities/instance";
import { Status } from "megalodon/lib/src/entities/status";
import Parser from "rss-parser";
import {
    Component,
    createMemo,
    createResource,
    ErrorBoundary,
    JSX,
    Match,
    Show,
    Switch,
} from "solid-js";
import { SessionAuthManager, useAuth } from "~/auth/auth-manager";
import {
    PreprocessedPostBody,
    PreprocessedPostUserBar,
} from "~/components/post/preprocessed";
import { unwrapResponse } from "~/lib/clientUtil";
import { logger } from "~/logging";

type WebsiteLeagueAnnouncement = {
    status?: Status;
    text: string;
};

export const WebsiteLeagueBroadcast: Component = (props) => {
    const auth = useAuth();
    const client = auth.assumeSignedIn.client;
    const [announcement] = createResource(
        async (): Promise<WebsiteLeagueAnnouncement> => {
            const broadcastAccountSearchResults = unwrapResponse(
                await client.search("@league@websiteleague.org", {
                    limit: 1,
                    resolve: true,
                })
            );
            if (broadcastAccountSearchResults.accounts.length === 0) {
                return { text: "failed to get broadcast announcement account" };
            }
            const broadcastAccount = broadcastAccountSearchResults.accounts[0];

            const lastStatus = unwrapResponse(
                await client.getAccountStatuses(broadcastAccount.id, {
                    limit: 1,
                    pinned: false,
                })
            );

            if (lastStatus.length === 0) {
                return { text: "failed to get broadcast announcement status" };
            }

            // make sure it is really the latest
            const announcement = await getLatestAnnouncementFromFeed(
                client,
                auth,
                lastStatus[0]
            );

            if (announcement === undefined) {
                return { text: "failed to get broadcast announcement status." };
            }

            return { text: announcement.content, status: announcement };
        }
    );

    return (
        <ErrorBoundary fallback={<div>error retrieving announcement</div>}>
            <Show when={!announcement.loading}>
                <div class="pbCard" style="margin-top: 2em;">
                    <h1 style="font-style: italic; text-align:center;">
                        latest announcement
                    </h1>

                    <Switch>
                        <Match when={announcement()?.status !== undefined}>
                            <PreprocessedPostUserBar
                                status={announcement()!.status!}
                            ></PreprocessedPostUserBar>
                            <PreprocessedPostBody
                                status={announcement()!.status!}
                                limitInitialHeight={true}
                            ></PreprocessedPostBody>
                        </Match>
                        <Match
                            when={
                                announcement()?.status === undefined &&
                                !announcement.loading
                            }
                        >
                            <div class="pbPostUserBar">announcement</div>
                            <div>{announcement()?.text}</div>
                        </Match>
                    </Switch>
                </div>
            </Show>
        </ErrorBoundary>
    );
};

async function getLatestAnnouncementFromFeed(
    client: MegalodonInterface,
    auth: SessionAuthManager,
    knownLatest?: Status
): Promise<Status | undefined> {
    try {
        const feed = await getRssFeed(
            "https://broadcast.websiteleague.org/@league/feed.rss",
            auth
        );

        if (feed === undefined) {
            logger.info("didn't use or couldn't get rss feed");
            return knownLatest;
        }

        if (feed.items.length === 0) {
            logger.info("rss feed contained no items");
            return knownLatest;
        }

        const topItem = feed.items[0];
        if (topItem.link === undefined) {
            logger.info("rss feed top item had no link");
            return knownLatest;
        }

        if (knownLatest !== undefined && knownLatest.url === topItem.link) {
            logger.info("rss feed top item matches the last known post");
            return knownLatest;
        }

        const result = unwrapResponse(await client.search(topItem.link));
        if (result.statuses.length === 0) {
            logger.info(`no search results for rss item ${topItem.link}`);
            return knownLatest;
        }
        return result.statuses[0];
    } catch (e) {
        if (e instanceof Error) {
            console.error(
                `failed to get announcement from rss feed: ${e.message}`
            );
            return undefined;
        }
    }
}

async function getRssFeed(
    url: string,
    auth: SessionAuthManager
): Promise<Parser.Output<{ [key: string]: any }> | undefined> {
    if (
        "lastChecked" in auth.persistentStore &&
        auth.persistentStore.lastChecked !== undefined
    ) {
        const lastChecked: string | undefined =
            auth.persistentStore.lastChecked[url];
        const now = DateTime.now();
        const ago = now.diff(DateTime.fromISO(lastChecked));
        if (ago.as("seconds") < Duration.fromISO("PT6H").as("seconds")) {
            logger.info(
                `last checked rss feed ${ago} ago, too recent to check again.`
            );
            return undefined;
        }
    }
    const rssParser = new Parser();
    const feedRequest = await fetch(url);

    auth.setPersistentStore("lastChecked", (c) => {
        return {
            [url]: DateTime.now().toISO(),
        };
    });

    if (feedRequest.status !== 200) {
        logger.info(`failed to retrieve rss feed: ${feedRequest.statusText}`);
        return undefined;
    }
    const feedText = await feedRequest.text();
    const feed = await rssParser.parseString(feedText);
    return feed;
}
