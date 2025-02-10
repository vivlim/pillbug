import { Engine, EngineOptions, EngineResult, RuleProperties } from "json-rules-engine";
import { Status, StatusTag } from "megalodon/lib/src/entities/status";
import { SessionAuthManager } from "~/auth/auth-manager";
import { FeedRuleEvent, FeedRuleProperties, ProcessedStatus } from "~/components/feed/feed-engine";
import { SettingsManager } from "~/lib/settings-manager";
import { CachePartitionKey, CacheKey, RuleEngineBase } from "./rule-engine";
import { logger } from "~/logging";
import createUrlRegExp from "url-regex-safe";
import { MegalodonInterface } from "megalodon";
import { unwrapResponse } from "~/lib/clientUtil";

export interface PostRuleEvaluationContext {
    auth: SessionAuthManager;
    settings: SettingsManager;
    parent?: ProcessedStatus;
    getByUrl(postUrl: string): Promise<Status | null>;
}

export type PostRuleset = FeedRuleProperties[]

class PostRuleEngine extends RuleEngineBase<Status, ProcessedStatus, PostRuleset, PostRuleEvaluationContext> {
    buildEngine(context: PostRuleEvaluationContext, rules: PostRuleset): Engine {
        const options: EngineOptions = {}
        const engineRules = rules.map(r => r.build())

        const engine = new Engine(engineRules, options)
        engine.addFact("tagList", async (params, almanac) => {
            const tags = (await almanac.factValue("tags")) as StatusTag[] | undefined
            if (tags === undefined) { return [] }
            return tags.map(t => t.name)
        })
        return engine;
    }
    partitionKey(context: PostRuleEvaluationContext, rules: PostRuleset): CachePartitionKey {
        return JSON.stringify([context.auth.assumeSignedIn.state.accountData.acct,
        context.auth.assumeSignedIn.state.domain,
            rules]) as CachePartitionKey
    }
    cacheKey(input: Status): CacheKey {
        return input.id as CacheKey
    }
    async postprocessEngineResult(input: Status, result: EngineResult, context: PostRuleEvaluationContext, rules: PostRuleset): Promise<ProcessedStatus> {
        const labels: string[] = [];
        const processedStatus: ProcessedStatus = { status: input, labels, rawRuleResults: { positive: result.results, negative: result.failureResults }, hide: false, collapseReasons: [], linkedAncestors: [] }
        let attachedLinked = false;
        for (let rawEvent of result.events) {
            const e = rawEvent as FeedRuleEvent;
            if (e.type === "applyLabel") {
                labels.push(e.params.label);
            } else if (e.type === "hidePost") {
                processedStatus.hide = true;
            } else if (e.type === "collapsePost") {
                processedStatus.collapseReasons.push(e.params.label)
            } else if (e.type === "attachLinked" && !attachedLinked && context.parent === undefined) {
                attachedLinked = true;
                processedStatus.linkedAncestors = await this.retrieveLinkedAncestors(processedStatus, context, rules)
            }
        }

        return processedStatus
    }
    preprocessEngineResult(input: Status, context: PostRuleEvaluationContext): Status {
        if (context.parent === undefined) {
            return input
        }

        // Inherit cw from share parent if there is one
        var patch: Partial<Status> = {};
        if (context.parent.status.spoiler_text?.length > 0 && (input.spoiler_text === undefined || input.spoiler_text.length === 0)) {
            patch.spoiler_text = `${context.parent.status.spoiler_text} (inherited from linking post)`;
        }
        if (context.parent.status.sensitive && !input.sensitive) {
            patch.sensitive = true;
        }

        return { ...input, ...patch };
    }
    async isCacheItemStillValid(input: Status, output: ProcessedStatus): Promise<boolean> {
        //logger.debug(`Unconditionally using cached version of ${input.id} by ${input.account.acct} (${input.url}}`)
        // Disable using rule engine cache as part of migration to redux
        return false;
    }

    private async retrieveLinkedAncestors(s: ProcessedStatus, context: PostRuleEvaluationContext, rules: PostRuleset): Promise<ProcessedStatus[]> {
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

                const status = await context.getByUrl(url);
                if (status === null) {
                    logger.info(`A linked post (${url}) couldn't be found while retrieving ancestor posts for ${s.status.id}. Returning with ${statuses.length} posts`)
                    return statuses;
                }

                // check if that status is already in our list, if so then there's a cycle and we'll bail out now.
                if (statuses.findIndex(ps => ps.status.id === status.id) >= 0) {
                    logger.info(`Detected link cycle trying to retrieve ancestor posts for ${s.status.id}. Returning with ${statuses.length} posts`)
                    return statuses;
                }

                const processedResult = await this.process([status], { ...context, parent: current }, rules)
                if (processedResult.length === 0) {
                    break;
                }

                const processed = processedResult[0].out;

                if (processed.hide) {
                    // This catches replies and stops them from being attached. for now ... probably need to ignore this and differentiate 'hide from feed' from 'hide altogether'
                    logger.info(`a post linked by ${s.status.id} would have been hidden, but isn't as a workaround until more granular hiding is available in feed engine`)
                    //logger.info(`A linked post was hidden by a rule while retrieving ancestor posts for ${s.status.id}. Returning with ${statuses.length} posts`)
                    //return statuses;
                }

                statuses.push(processed)
                current = processed;
            }
            catch (e) {
                logger.warn(`Error trying to fetch ${statuses.length}th linked ancestor post for ${s.status.id}. returning whatever's available.`, e)
                return statuses;
            }
        }
        return statuses;
    }

}

const urlRegex = createUrlRegExp({
    strict: true,
    localhost: false,
});

export function getShareParentUrl(status: Status): string | undefined {
    let content = status.content;
    if (status.reblog) {
        content = status.reblog.content
    }
    let urls = content.match(urlRegex);
    if (urls === null) {
        return undefined;
    }
    let postUrl = urls.find((u) => u.match(/statuses|objects|notes|\d{18}/)) ?? undefined;
    return postUrl;
}

const instance = new PostRuleEngine();
export function GetPostRuleEngine(): PostRuleEngine {
    return instance
}

export async function defaultGetByUrl(client: MegalodonInterface, postUrl: string): Promise<Status | null> {
    const searchResult = unwrapResponse(await client.search(postUrl, { type: "statuses", resolve: true, limit: 1 }))
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