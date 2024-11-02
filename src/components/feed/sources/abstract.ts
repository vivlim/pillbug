import { Status } from "megalodon/lib/src/entities/status";
import { FeedManifest } from "../feed-engine";

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

    //** defining this allows the feed sources to be serialized, which means they can be used as an argument to cache */
    toJSON() {
        return this.describe()
    }
}
