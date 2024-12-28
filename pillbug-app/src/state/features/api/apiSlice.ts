import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query"
import { createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { MegalodonInterface, Response } from "megalodon"
import { Status } from "megalodon/lib/src/entities/status"
import { StaticSessionContextWorkaround } from "~/App"
import { unwrapResponse } from "~/lib/clientUtil"
import { Account } from "megalodon/lib/src/entities/account"
import { logger } from "~/logging"

//** List of methods that will be detoured to and cached by redux */
export const MegalodonCachedMethods = [
    'getHomeTimeline',
    'getAccountStatuses',
    'search',
] as const satisfies Array<keyof MegalodonInterface>;

//** Methods that will be detoured to and cached by redux */
export type MegalodonCachedMethodsType = typeof MegalodonCachedMethods[number]

export type MegalodonQuery = { 'action': 'get', 'kind': 'post', 'id': string }
export type PillbugApiQuery = MegalodonQuery | string
/*
type PillbugQueryType = (() => PillbugApiQuery)
type PillbugEndpointDefinitions = {};
*/

function unwrapApiResponse<T>(p: Response<T>): { data: T } {
    return { data: unwrapResponse(p) }
}

const accountAdapter = createEntityAdapter<Account>();
const initialState = accountAdapter.getInitialState();

// https://steveholgado.com/typescript-types-from-arrays/
//** Extra tag types that may be passed in from the cached megalodon proxy */
export const MegalodonExtraTags = ["foo", "bar"] as const;

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: async (args: PillbugApiQuery) => {
        try {
            if (typeof args === 'string' || args instanceof String) {
                throw new Error("string queries not implemented")
            }

            const auth = StaticSessionContextWorkaround()!.authManager;
            if (!auth.state.signedIn) {
                throw new Error("Not signed in");
            }
            const megalodon = auth.state.authenticatedClient;

            if (args.kind === "post") {
                if (args.action === "get") {
                    return unwrapApiResponse(await megalodon.getStatus(args.id));
                }
            }

            throw new Error(`unhandled query: ${JSON.stringify(args)}`)
        }
        catch (e) {
            return { error: e }
        }

    },
    tagTypes: [...MegalodonExtraTags, 'Post'],
    endpoints: (builder) => ({
        getStatus: builder.query<NormalizedStatus, string>({
            query: (postId) => ({ action: 'get', kind: 'post', id: postId }),
            providesTags: (result, error, arg) => [{ type: 'Post', id: arg }],
            transformResponse(res: Status) {
                const { account, ...rest } = res;
                const accountEntity = accountAdapter.setOne(initialState, account);
                return { ...rest, account: accountEntity };
            }
        }),
        megalodon: builder.query<Promise<any>, DetouredMegalodonCall>({
            queryFn: async (arg, api, options) => {
                try {
                    const auth = StaticSessionContextWorkaround()!.authManager;
                    if (!auth.state.signedIn) {
                        throw new Error("Not signed in");
                    }
                    const megalodonClient = auth.state.authenticatedClient as any;
                    const result = await megalodonClient[arg.method](...arg.args);
                    // Need to unpack the resulting data object and drop header info
                    const { headers, ...rest } = result
                    // logger.debug("In queryfn, result data:", result, arg)
                    return {
                        data: rest, meta: {
                            headers
                        }
                    };
                }
                catch (error) {
                    return { error }
                }
            },
            providesTags: (result, error, args) => {
                return [...args.extraTags]
            }

        })
    })
})

export type DetouredMegalodonCall = {
    method: MegalodonCachedMethodsType,
    args: any,
    extraTags: (typeof MegalodonExtraTags[number])[]
}

//** Status but with some stuff normalized out, like account */
export type NormalizedStatus = Omit<Status, "account"> & { account: EntityState<Account, string> }


export const { getStatus } = apiSlice.endpoints;
export const cachedMegalodonApiEndpoint = apiSlice.endpoints.megalodon;