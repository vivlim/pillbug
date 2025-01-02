import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query"
import { createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { Gotosocial, Mastodon, MegalodonInterface, Response } from "megalodon"
import { Status, StatusTag } from "megalodon/lib/src/entities/status"
import { StaticSessionContextWorkaround } from "~/App"
import { unwrapResponse } from "~/lib/clientUtil"
import { Account } from "megalodon/lib/src/entities/account"
import { logger } from "~/logging"
import { Engine, EngineOptions, EngineResult, RuleProperties, RunOptions } from "json-rules-engine"
import { store } from "~/state/store"
import { Post, postSelectors } from "../entityGraph/entityGraphSlice"

const accountAdapter = createEntityAdapter<Account>();
const initialState = accountAdapter.getInitialState();

// https://steveholgado.com/typescript-types-from-arrays/
//** Extra tag types that may be passed in from the cached megalodon proxy */
export const MegalodonExtraTags = ["foo", "bar"] as const;

export type RuleQuery = {
    inputs: Record<string, any>,
    rules: RuleProperties[],
    options: EngineOptions,
    runOptions: RunOptions
}

export type RuleEvaluation = {
    inputId: string,
    out: EngineResult
}

export type PostRuleQuery = {
    postId: string[],
    rules: RuleProperties[],
}

export const rulesSlice = createApi({
    reducerPath: 'api',
    baseQuery: async (args: RuleQuery) => {
        try {
            const engine = new Engine(args.rules, args.options)

            engine.addFact("tagList", async (params, almanac) => {
                const tags = (await almanac.factValue("tags")) as StatusTag[] | undefined
                if (tags === undefined) { return [] }
                return tags.map(t => t.name)
            })

            const promises: Promise<RuleEvaluation>[] = [];
            for (let input in args.inputs) {
                promises.push((async () => {
                    const result = await engine.run(args.inputs[input], args.runOptions);
                    return { inputId: input, out: result }
                })())
            }

            const results = await Promise.all(promises)
            return { data: results };
        }
        catch (e) {
            return { error: e }
        }
    },
    tagTypes: ['PostRuleEvaluation'],
    endpoints: (builder) => ({
        evaluatePostRules: builder.query<RuleEvaluation[], PostRuleQuery>({
            query: (arg: PostRuleQuery) => {
                //const entities = postSelectors.selectEntities(store.getState());
                const inputs: Record<string, Post> = {};
                const storeState = store.getState();
                for (const id of arg.postId) {
                    inputs[id] = postSelectors.selectById(storeState, id);
                }

                const query: RuleQuery = {
                    inputs,
                    rules: arg.rules,
                    options: {},
                    runOptions: {},
                };
                return query;
            },
            providesTags: (result, error, arg) => [{ type: 'PostRuleEvaluation' }],
            transformResponse: (response) => {
                return response;
            }
        }),
    })
})

export const { evaluatePostRules } = rulesSlice.endpoints;