import { SessionAuthManager } from "~/auth/auth-manager";
import { ClientFeedSource, FeedSource } from "./abstract";
import { Status } from "megalodon/lib/src/entities/status";
import { FeedManifest } from "../feed-engine";
import { unwrapResponse } from "~/lib/clientUtil";
import { logger } from "~/logging";
import { PostRuleEvaluationContext } from "~/components/post/rule-engine/post-rule-engine";
import { SettingsManager } from "~/lib/settings-manager";

export class SingleStatusFeed extends ClientFeedSource {
    constructor(auth: SessionAuthManager, settings: SettingsManager, private status: Status) {
        super(auth, settings)
    }

    override async fetch(manifest: Omit<FeedManifest, "source">, after?: string | undefined): Promise<{ statuses: Status[]; moreAvailable: boolean; }> {
        return { statuses: [this.status], moreAvailable: false }
    }

    describe(): string {
        return "single post feed source"
    }

    async getByUrl(postUrl: string): Promise<Status | null> {
        const searchResult = unwrapResponse(await this.auth.assumeSignedIn.client.search(postUrl, { type: "statuses", resolve: true, limit: 1 }))
        if (searchResult.statuses.length > 0) {
            const requestedLastPart = postUrl.split("/").slice(-1)[0]
            const foundLastPart = searchResult.statuses[0].url!.split("/").slice(-1)[0]
            if (requestedLastPart === foundLastPart) {
                return searchResult.statuses[0]
            }
            logger.warn(`Retrieved by url ${searchResult.statuses[0].url} but this is different from the requested ${postUrl}`)
        }
        return null
    }
}