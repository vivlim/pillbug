import { Engine, EngineResult, RuleProperties } from "json-rules-engine";
import { Status } from "megalodon/lib/src/entities/status";
import { SessionAuthManager } from "~/auth/auth-manager";
import { SettingsManager } from "~/lib/settings-manager";


export interface RuleEngine<TInput extends Record<string, any>, TOutput, TRules, TContext> {
    process(inputs: TInput[], context: TContext, rules: TRules): Promise<{ in: TInput, out: TOutput }[]>;
}

export type CachePartitionKey = any & { readonly __tag: unique symbol };
export type CacheKey = any & { readonly __tag: unique symbol };

export abstract class RuleEngineBase<TInput extends Record<string, any>, TOutput, TRules, TContext> implements RuleEngine<TInput, TOutput, TRules, TContext> {
    protected readonly engineCache: Map<CachePartitionKey, Engine> = new Map();
    protected readonly cache: Map<CachePartitionKey, Map<CacheKey, TOutput>> = new Map();

    abstract buildEngine(context: TContext, rules: TRules): Engine;
    abstract partitionKey(context: TContext, rules: TRules): CachePartitionKey;
    abstract cacheKey(input: TInput): CacheKey;

    protected getContext(context: TContext, rules: TRules): [CachePartitionKey, Engine] {
        const key = this.partitionKey(context, rules);
        let builtEngine = this.engineCache.get(key);
        if (builtEngine !== undefined) {
            return [key, builtEngine];
        }

        builtEngine = this.buildEngine(context, rules)
        this.engineCache.set(key, builtEngine);
        return [key, builtEngine];
    }

    private getCachePartition(key: CachePartitionKey): Map<CacheKey, TOutput> {
        let partition = this.cache.get(key);
        if (partition !== undefined) {
            return partition;
        }

        partition = new Map();
        this.cache.set(key, partition);
        return partition;
    }

    public async process(inputs: TInput[], context: TContext, rules: TRules): Promise<{ in: TInput, out: TOutput }[]> {
        const [partitionKey, engine] = this.getContext(context, rules);
        const cachePartition = this.getCachePartition(partitionKey);
        const promises: Promise<{ in: TInput, out: TOutput }>[] = [];

        // process all the inputs, checking if they're in the cache & are still valid.
        for (const input of inputs) {
            const cacheKey = this.cacheKey(input);
            let existing = cachePartition.get(cacheKey);

            if (existing !== undefined) {
                promises.push((async () => {
                    const stillValid = await this.isCacheItemStillValid(input, existing);

                    if (stillValid) {
                        return { in: input, out: existing as TOutput }
                    }
                    else {
                        const i = this.preprocessEngineResult(input, context);
                        const engineResult = await this.processSingle(i, engine);
                        const postprocessed = await this.postprocessEngineResult(i, engineResult, context, rules);
                        cachePartition.set(cacheKey, postprocessed);
                        return { in: input, out: postprocessed };
                    }
                })());
            }
            else {
                promises.push((async () => {
                    const i = this.preprocessEngineResult(input, context);
                    const engineResult = await this.processSingle(i, engine);
                    const postprocessed = await this.postprocessEngineResult(i, engineResult, context, rules);
                    cachePartition.set(cacheKey, postprocessed);
                    return { in: input, out: postprocessed };
                })())
            }
        }

        const results: { in: TInput, out: TOutput }[] = await Promise.all(promises);
        return results;
    }

    private async processSingle(input: TInput, engine: Engine): Promise<EngineResult> {
        return await engine.run(input);
    }

    abstract preprocessEngineResult(input: TInput, context: TContext): TInput;
    abstract postprocessEngineResult(input: TInput, engineResult: EngineResult, context: TContext, rules: TRules): Promise<TOutput>;

    abstract isCacheItemStillValid(input: TInput, output: TOutput): Promise<boolean>

}