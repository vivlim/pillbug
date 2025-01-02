import { Engine, EngineResult, RuleProperties } from "json-rules-engine";
import { Status } from "megalodon/lib/src/entities/status";
import { SessionAuthManager } from "~/auth/auth-manager";
import { SettingsManager } from "~/lib/settings-manager";
import { postSelectors } from "~/state/features/entityGraph/entityGraphSlice";
import { RuleEvaluation, rulesSlice } from "~/state/features/rules/rulesSlice";
import { store } from "~/state/store";


export interface RuleEngine<TInput extends Record<string, any>, TOutput, TRules, TContext> {
    process(inputs: TInput[], context: TContext, rules: TRules): Promise<TOutput[]>;
}

export type CachePartitionKey = any & { readonly __tag: unique symbol };
export type CacheKey = any & { readonly __tag: unique symbol };

export abstract class RuleEngineBase<TInput extends Record<string, any>, TOutput, TRules, TContext> implements RuleEngine<TInput, TOutput, TRules, TContext> {
    protected readonly engineCache: Map<CachePartitionKey, Engine> = new Map();
    protected readonly cache: Map<CachePartitionKey, Map<CacheKey, TOutput>> = new Map();

    abstract buildRules(context: TContext, rules: TRules): RuleProperties[];
    abstract partitionKey(context: TContext, rules: TRules): CachePartitionKey;
    abstract cacheKey(input: TInput): CacheKey;

    public async process(inputs: TInput[], context: TContext, rules: TRules): Promise<TOutput[]> {

        const postId = inputs.map(i => i.id);
        const builtRules = this.buildRules(context, rules);

        const evaluation = await store.dispatch(rulesSlice.endpoints.evaluatePostRules.initiate({ postId, rules: builtRules }))
        if (evaluation.data === undefined) {
            throw new Error("Failed to evaluate rules");
        }

        const storeState = store.getState();

        /*
        const postProcessed = await Promise.all(
            evaluation.data.map(
                res => (async () => {
                    const input = postSelectors.selectById(storeState, res.inputId);
                    const postProcessed = await this.postprocessEngineResult(input, res.out, context, rules);
                    return {
                        in: input,
                        out: postProcessed,
                    };
                })()))
                    */
        const postProcessed = await this.postprocessEngineResult(inputs, evaluation.data, context, rules);
        return postProcessed;
    }

    private async processSingle(input: TInput, engine: Engine): Promise<EngineResult> {
        return await engine.run(input);
    }

    abstract postprocessEngineResult(input: TInput[], engineResult: RuleEvaluation[], context: TContext, rules: TRules): Promise<TOutput[]>;

    abstract isCacheItemStillValid(input: TInput, output: TOutput): Promise<boolean>

}