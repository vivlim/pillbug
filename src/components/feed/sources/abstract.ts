import { Status } from "megalodon/lib/src/entities/status";
import { FeedManifest } from "../feed-engine";
import { PostRuleEvaluationContext } from "~/components/post/rule-engine/post-rule-engine";
import { SettingsManager } from "~/lib/settings-manager";
import { SessionAuthManager } from "~/auth/auth-manager";
import { logger } from "~/logging";

export interface LinkedPostRetriever {
    getByUrl(postUrl: string): Promise<Status | null>
}

/** somewhere that posts can be obtained from */
export abstract class FeedSource implements LinkedPostRetriever {
    /** obtains posts from the source */
    abstract fetch(manifest: Omit<FeedManifest, "source">, after?: string): Promise<{ statuses: Status[], moreAvailable: boolean }>;
    /** describe the source in human-readable terms */
    abstract describe(): string
    /** retrieves specific posts by url */
    abstract getByUrl(postUrl: string): Promise<Status | null>;

    abstract context(): PostRuleEvaluationContext;

    //** defining this allows the feed sources to be serialized, which means they can be used as an argument to cache */
    toJSON() {
        return this.describe()
    }
}

export abstract class ClientFeedSource extends FeedSource {
    private ctx: PostRuleEvaluationContext;
    constructor(protected auth: SessionAuthManager, protected settings: SettingsManager) {
        super()
        logger.info(`Constructed a new ClientFeedSource`, auth, settings)
        this.ctx = {
            auth,
            settings,
            parent: undefined,
            getByUrl: (url) => this.getByUrl(url),
        }
    }

    override context(): PostRuleEvaluationContext {
        return this.ctx
    }
}