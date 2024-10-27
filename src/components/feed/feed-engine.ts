import { Engine, EngineOptions, EngineResult, EventHandler, RuleProperties, RuleResult, TopLevelCondition } from "json-rules-engine";
import { Status, StatusTag } from "megalodon/lib/src/entities/status";
import { MultiTextboxSpec } from "../textbox";

const Facts = {

}

export interface FeedRulePropertiesss {
    conditions: TopLevelCondition;
    event: Event;
    name?: string;
    priority?: number;
    onSuccess?: EventHandler;
    onFailure?: EventHandler;
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

}

export class FeedEngine {
    private engine: Engine;

    constructor(rules: FeedRuleProperties[]) {
        const options: EngineOptions = {}
        const engineRules = rules.map(r => r.build())

        this.engine = new Engine(engineRules, options)
        this.engine.addFact("tagList", async (params, almanac) => {
            const tags = (await almanac.factValue("tags")) as StatusTag[] | undefined
            if (tags === undefined) { return [] }
            return tags.map(t => t.name)
        })
    }

    public async process(statuses: Status[]): Promise<ProcessedStatus[]> {
        const results: ProcessedStatus[] = [];
        for (let s of statuses) {
            const result: EngineResult = await this.engine.run(s)
            console.log(`Rule result:${JSON.stringify(result)}`)
            const labels: string[] = [];
            const processedStatus: ProcessedStatus = { status: s, labels, rawRuleResults: { positive: result.results, negative: result.failureResults }, hide: false, collapseReasons: [] }
            for (let rawEvent of result.events) {
                const e = rawEvent as FeedRuleEvent;
                if (e.type === "applyLabel") {
                    labels.push(e.params.label);
                } else if (e.type === "hidePost") {
                    processedStatus.hide = true;
                } else if (e.type === "collapsePost") {
                    processedStatus.collapseReasons.push(e.params.label)
                }
            }

            results.push(processedStatus)
        }
        return results;
    }
}

export type FeedRuleEventType = "applyLabel" | "collapsePost" | "hidePost"

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