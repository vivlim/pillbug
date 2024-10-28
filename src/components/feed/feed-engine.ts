import { Engine, EngineOptions, EngineResult, EventHandler, RuleProperties, RuleResult, TopLevelCondition } from "json-rules-engine";
import { Status, StatusTag } from "megalodon/lib/src/entities/status";
import { MultiTextboxSpec } from "../textbox";
import createUrlRegExp from "url-regex-safe";
import { FeedSource } from "./sources/abstract";

const Facts = {

}

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
    linkedAncestors: ProcessedStatus[]
}

export class FeedEngine {
    private ruleEngine: Engine;
    private retrievedStatusIds: Set<string> = new Set();
    private lastRetrievedStatusId: string | undefined = undefined;
    private statusIds: string[] = []
    //** ordered statuses with processing applied */
    private processedStatuses: ProcessedStatus[] = []

    constructor(public readonly manifest: FeedManifest, rules: FeedRuleProperties[]) {
        const options: EngineOptions = {}
        const engineRules = rules.map(r => r.build())

        this.ruleEngine = new Engine(engineRules, options)
        this.ruleEngine.addFact("tagList", async (params, almanac) => {
            const tags = (await almanac.factValue("tags")) as StatusTag[] | undefined
            if (tags === undefined) { return [] }
            return tags.map(t => t.name)
        })
    }

    public async getPosts(pageNumber?: number): Promise<ProcessedStatus[]> {
        if (pageNumber !== undefined && this.manifest.postsPerPage !== null) {
            if (pageNumber < 1) {
                throw new Error("page number can't be less than 1")
            }

            const numberOfPostsNeeded = pageNumber * this.manifest.postsPerPage

            while (numberOfPostsNeeded > this.processedStatuses.length) {
                let afterId = undefined;
                if (this.statusIds.length > 0) {
                    afterId = this.statusIds[this.statusIds.length - 1]
                }

                const { moreAvailable } = await this.getAndProcessPosts(afterId)
                if (!moreAvailable) {
                    break;
                }
            }
            return this.processedStatuses.slice((pageNumber - 1) * this.manifest.postsPerPage, numberOfPostsNeeded)
        }
        else {
            await this.getAndProcessPosts();
            return this.processedStatuses;
        }
    }

    private async getAndProcessPosts(after?: string): Promise<{ moreAvailable: boolean }> {
        const { statuses, moreAvailable } = await this.manifest.source.fetch(this.manifest, after)
        if (statuses.length === 0) {
            return { moreAvailable: false }
        }
        for (let status of statuses) {
            if (status.id in this.retrievedStatusIds) {
                // no action since we have already retrieved and processed it
                continue;
            }

            const processed = await this.process(status)
            if (!processed.hide) {
                this.processedStatuses.push(processed)
            }
            this.retrievedStatusIds.add(status.id)
        }
        this.lastRetrievedStatusId = statuses[statuses.length - 1].id
        return { moreAvailable };
    }

    private async process(s: Status, inner?: boolean): Promise<ProcessedStatus> {
        const result: EngineResult = await this.ruleEngine.run(s)
        console.log(`Rule result:${JSON.stringify(result)}`)
        const labels: string[] = [];
        const processedStatus: ProcessedStatus = { status: s, labels, rawRuleResults: { positive: result.results, negative: result.failureResults }, hide: false, collapseReasons: [], linkedAncestors: [] }
        let attachedLinked = false;
        for (let rawEvent of result.events) {
            const e = rawEvent as FeedRuleEvent;
            if (e.type === "applyLabel") {
                labels.push(e.params.label);
            } else if (e.type === "hidePost") {
                processedStatus.hide = true;
            } else if (e.type === "collapsePost") {
                processedStatus.collapseReasons.push(e.params.label)
            } else if (e.type === "attachLinked" && !attachedLinked && !inner) {
                attachedLinked = true;
                processedStatus.linkedAncestors = await this.retrieveLinkedAncestors(processedStatus)
            }
        }

        // retrieve share parents

        return processedStatus
    }

    private async retrieveLinkedAncestors(s: ProcessedStatus): Promise<ProcessedStatus[]> {
        if (s.hide) {
            return []
        }

        const statuses: ProcessedStatus[] = []

        let current: ProcessedStatus = s
        while (true) {
            try {
                const url = getShareParentUrl(current.status)
                if (url === undefined) {
                    return statuses;
                }

                const status = await this.manifest.source.getByUrl(url)
                if (status === null) {
                    console.log(`A linked post (${url}) couldn't be found while retrieving ancestor posts for ${s.status.id}. Returning with ${statuses.length} posts`)
                    return statuses;
                }

                // check if that status is already in our list, if so then there's a cycle and we'll bail out now.
                if (statuses.findIndex(ps => ps.status.id === status.id) >= 0) {
                    console.log(`Detected link cycle trying to retrieve ancestor posts for ${s.status.id}. Returning with ${statuses.length} posts`)
                    return statuses;
                }

                const processed = await this.process(status, true)
                if (processed.hide) {
                    console.log(`A linked post was hidden by a rule while retrieving ancestor posts for ${s.status.id}. Returning with ${statuses.length} posts`)
                    return statuses;
                }

                statuses.push(processed)
                current = processed;
            }
            catch (e) {
                if (e instanceof Error) {
                    console.log(`Error trying to fetch ${statuses.length}th linked ancestor post for ${s.status.id}. returning whatever's available. ${e.stack ?? e.message}`)
                }

            }
        }

    }
}

const urlRegex = createUrlRegExp({
    strict: true,
    localhost: false,
});

function getShareParentUrl(status: Status): string | undefined {
    let urls = status.content.match(urlRegex);
    if (urls === null) {
        return undefined;
    }
    return urls.find((u) => u.match(/statuses|objects|\d{18}/)) ?? undefined;
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

type FeedRuleAction = {
    label: string;
    stringParams: FeedRuleActionParam[];
}

interface FeedRuleActionParam extends MultiTextboxSpec {
}

export const FeedRuleActions: Record<FeedRuleEventType, FeedRuleAction> = {
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

export class FeedRuleProperties {
    constructor(public conditions: TopLevelCondition, public ev: FeedRuleEvent, public name?: string, public priority?: number) {

    }

    public build(): RuleProperties {
        return {
            conditions: this.conditions,
            event: this.ev,
            name: this.name,
            priority: this.priority,
        }
    }
}