import { SessionAuthManager } from "~/auth/auth-manager";
import { FeedSource } from "./abstract";
import { Status } from "megalodon/lib/src/entities/status";
import { FeedManifest } from "../feed-engine";
import { unwrapResponse } from "~/lib/clientUtil";

export class UserFeedSource extends FeedSource {
    constructor(private auth: SessionAuthManager, private userId: string, private acct: string, private includePinned: boolean = false) {
        super()
    }

    override async fetch(manifest: Omit<FeedManifest, "source">, after?: string | undefined): Promise<{ statuses: Status[]; moreAvailable: boolean; }> {
        const statuses = unwrapResponse(await this.auth.assumeSignedIn.client.getAccountStatuses(this.userId, {
            exclude_replies: true,
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
                statuses.unshift(
                    ...pinnedStatuses.map(
                        (status) => {
                            status.pinned = true;
                            return status;
                        }
                    )
                );
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
        const searchResult = unwrapResponse(await this.auth.assumeSignedIn.client.search(postUrl, { type: "statuses", limit: 1 }))
        if (searchResult.statuses.length > 0) {
            return searchResult.statuses[0]
        }
        return null
    }
}