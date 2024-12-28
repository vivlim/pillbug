import { SessionAuthManager } from "~/auth/auth-manager";
import { ClientFeedSource, FeedSource } from "./abstract";
import { Status } from "megalodon/lib/src/entities/status";
import { FeedManifest } from "../feed-engine";
import { unwrapResponse } from "~/lib/clientUtil";
import { logger } from "~/logging";
import { PostRuleEvaluationContext } from "~/components/post/rule-engine/post-rule-engine";
import { SettingsManager } from "~/lib/settings-manager";

export class UserFeedSource extends ClientFeedSource {
    constructor(auth: SessionAuthManager, settings: SettingsManager, private userId: string, private acct: string, private includePinned: boolean = false) {
        super(auth, settings)
    }

    override async fetch(manifest: Omit<FeedManifest, "source">, after?: string | undefined): Promise<{ statuses: Status[]; moreAvailable: boolean; }> {
        var statuses = unwrapResponse(await this.auth.assumeSignedIn.client.getAccountStatuses(this.userId, {
            pinned: false,
            limit: manifest.postsToFetchPerBatch ?? undefined,
            max_id: after
        }))

        if (this.includePinned && after === undefined) {
            // If this is the first page, we need to get pinned posts.
            const pinnedStatuses = unwrapResponse(await this.auth.assumeSignedIn.client.getAccountStatuses(this.userId, {
                exclude_replies: true,
                pinned: true,
                limit: manifest.postsToFetchPerBatch ?? undefined,
            }))


            // HACK: this whole thing is kinda jank.
            // "pinned" is supposed to only apply for posts
            // *the requestor* pinned; for other profiles,
            // it's expected to be null.
            //
            // That said, we at least know there's no
            // situation where we're clobbering an otherwise
            // valid value.
            if (pinnedStatuses.length > 0) {
                statuses = [
                    ...pinnedStatuses.map(
                        (status) => {
                            return {
                                ...status,
                                pinned: true
                            }
                        }
                    ),
                    ...statuses
                ];
            }
        }

        // if we got fewer than expected, infer that there are no more.
        const moreAvailable: boolean = statuses.length >= (manifest.postsToFetchPerBatch ?? statuses.length)
        return { statuses, moreAvailable }
    }

    describe(): string {
        return "user feed source for " + this.acct
    }

    async getByUrl(postUrl: string): Promise<Status | null> {
        const searchResult = unwrapResponse(await this.auth.assumeSignedIn.client.search(postUrl, { type: "statuses", resolve: true, limit: 1 }))
        if (searchResult.statuses.length > 0) {
            if (searchResult.statuses[0].url === postUrl) {
                return searchResult.statuses[0]
            }
            logger.warn(`Retrieved by url ${searchResult.statuses[0].url} but this is different from the requested ${postUrl}`)
        }
        return null
    }
}