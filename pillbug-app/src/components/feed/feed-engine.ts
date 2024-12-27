import { Engine, EngineOptions, EngineResult, EventHandler, RuleProperties, RuleResult, TopLevelCondition } from "json-rules-engine";
import { Status, StatusTag } from "megalodon/lib/src/entities/status";
import { MultiTextboxSpec } from "../textbox";
import { FeedSource } from "./sources/abstract";
import { logger } from "../../logging";
import { GetPostRuleEngine, PostRuleEvaluationContext } from "../post/rule-engine/post-rule-engine";
import { IEditableRule, RuleAction, RuleActionSet, RuleEvent } from "json-rules-editor";

export interface FeedManifest {
    source: FeedSource;
    /** How many referenced post links to follow and fetch per post */
    fetchReferencedPosts: number;
    /** how many posts to fetch per page. if null, no pagination */
    postsPerPage: number | null;
    /** how many posts to fetch per batch */
    postsToFetchPerBatch: number | null;
}

export interface ProcessedStatus {
    status: Status,
    labels: string[],
    hide: boolean,
    collapseReasons: string[],
    rawRuleResults: {
        positive: RuleResult[];
        negative: RuleResult[];
    },
    linkedAncestors: ProcessedStatus[],
    replyingTo?: ProcessedStatus, // attached in post page only atm
}

export class FeedEngine {
    private retrievedStatusIds: Set<string> = new Set();
    private lastRetrievedStatusId: string | undefined = undefined;
    private statusIds: string[] = []
    //** ordered statuses with processing applied */
    private processedStatuses: ProcessedStatus[] = []
    private fetching: boolean = false;

    constructor(public readonly manifest: FeedManifest, private readonly rules: FeedRuleProperties[]) {
    }

    public async getPosts(pageNumber?: number, logCallback?: (msg: string) => void): Promise<{ posts: ProcessedStatus[], error?: Error }> {
        const log = (msg: string) => {
            logger.info(msg);
            if (logCallback !== undefined) {
                logCallback(msg);
            }
        }
        log(`entering FeedEngine.GetPosts from source ${this.manifest.source.describe()}`)
        if (this.fetching) {
            log(`Tried to get posts but another call to get posts is ongoing (requested page ${pageNumber})`)
            return { posts: [] }
        }
        this.fetching = true;
        try {
            let error: Error | undefined;
            if (pageNumber !== undefined && this.manifest.postsPerPage !== null) {
                if (pageNumber < 1) {
                    throw new Error("page number can't be less than 1")
                }

                const numberOfPostsNeeded = pageNumber * this.manifest.postsPerPage
                let remainingNumberOfRequests = 5;
                log(`have ${this.processedStatuses.length} posts before fetching any`)

                while (numberOfPostsNeeded > this.processedStatuses.length && remainingNumberOfRequests > 0) {
                    log(`fetching posts to populate feed; have ${this.processedStatuses.length} after filtering, trying to get ${numberOfPostsNeeded}. ${remainingNumberOfRequests} requests remain (request batch size: ${this.manifest.postsToFetchPerBatch}). last id: ${this.lastRetrievedStatusId}`)
                    remainingNumberOfRequests -= 1;

                    const result = await this.getAndProcessPosts(this.lastRetrievedStatusId)
                    error = result.error
                    if (!result.moreAvailable || error !== undefined) {
                        break;
                    }
                }
                return { posts: this.processedStatuses.slice((pageNumber - 1) * this.manifest.postsPerPage, numberOfPostsNeeded), error }
            }
            else {
                const { moreAvailable, error } = await this.getAndProcessPosts();
                return { posts: this.processedStatuses };
            }
        }
        finally {
            this.fetching = false;
        }
    }

    private async getAndProcessPosts(after?: string): Promise<{ moreAvailable: boolean, error?: Error | undefined }> {
        try {
            let { statuses, moreAvailable } = await this.manifest.source.fetch(this.manifest, after)
            if (statuses.length === 0) {
                return { moreAvailable: false }
            }

            statuses = statuses.filter(s => !this.retrievedStatusIds.has(s.id));

            const processedPosts: { in: Status, out: ProcessedStatus }[] = await GetPostRuleEngine().process(statuses, this.manifest.source.context(), this.rules)

            for (const result of processedPosts) {
                this.retrievedStatusIds.add(result.in.id);

                if (!result.out.hide) {
                    this.processedStatuses.push(result.out)
                }

                this.lastRetrievedStatusId = result.in.id;
            }

            return { moreAvailable };
        }
        catch (e) {
            if (e instanceof Error) {
                logger.info(`Error getting and processing posts: ${e.message}`)
                return { moreAvailable: false, error: e }
            }
            return { moreAvailable: false, error: new Error("unknown error") }
        }
    }

    //** defining this allows the feed sources to be serialized, which means they can be used as an argument to cache */
    toJSON() {
        const subset: { manifest: FeedManifest, rules: FeedRuleProperties[] } = { manifest: this.manifest, rules: this.rules }
        return subset;
    }
}

export type FeedRuleEventType = "applyLabel" | "collapsePost" | "hidePost" | "attachLinked"

export type FeedRuleEvent = {
    type: 'applyLabel',
    params: {
        label: string,
    }
} | {
    type: 'collapsePost', params: {
        label: string
    }
} | {
    type: 'hidePost'
} | {
    type: 'attachLinked'
};

export const FeedRuleActions: RuleActionSet<FeedRuleEventType> = {
    applyLabel: {
        label: "apply label",
        stringParams: [{
            key: "label",
            label: "label",
            description: "a client-side label to apply to the post",
            defaultValue: ""
        }]
    },
    collapsePost: {
        label: "collapse post",
        stringParams: [{
            key: "label",
            label: "label",
            description: "text to display where the collapsed post was",
            defaultValue: "this post was hidden by a rule"
        }]
    },
    hidePost: {
        label: "hide post",
        stringParams: []
    },
    attachLinked: {
        label: "attach linked post",
        stringParams: []
    }
}


export class FeedRuleProperties implements IEditableRule<FeedRuleEventType> {
    constructor(public description: string, public conditions: TopLevelCondition, public event: RuleEvent<FeedRuleEventType>, public enabled: boolean = true, public name?: string, public priority?: number) {

    }

    public build(): RuleProperties {
        return {
            conditions: this.conditions,
            event: this.event,
            name: this.name,
            priority: this.priority,
        }
    }
}