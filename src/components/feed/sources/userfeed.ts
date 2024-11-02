import { SessionAuthManager } from "~/auth/auth-manager";
import { FeedSource } from "./abstract";
import { Status } from "megalodon/lib/src/entities/status";
import { FeedManifest } from "../feed-engine";
import { unwrapResponse } from "~/lib/clientUtil";

export class UserFeedSource extends FeedSource {
    constructor(private auth: SessionAuthManager, private userId: string, private acct: string) {
        super()
    }

    override async fetch(manifest: Omit<FeedManifest, "source">, after?: string | undefined): Promise<{ statuses: Status[]; moreAvailable: boolean; }> {
        const statuses = unwrapResponse(await this.auth.assumeSignedIn.client.getAccountStatuses(this.userId, {
            exclude_replies: true,
            pinned: false,
            limit: manifest.postsToFetchPerBatch ?? undefined,
            max_id: after
        }))
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