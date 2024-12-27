import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query"
import { createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { Response } from "megalodon"
import { Status } from "megalodon/lib/src/entities/status"
import { StaticSessionContextWorkaround } from "~/App"
import { unwrapResponse } from "~/lib/clientUtil"
import { Account } from "megalodon/lib/src/entities/account"

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

//export const apiSlice = createApi<PillbugApiQuery, PillbugEndpointDefinitions, "api", ({
export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: async (args: PillbugApiQuery) => {
        try {
            if (typeof args === 'string' || args instanceof String) {
                throw new Error("string queries not implemented")
            }

            const megalodon = StaticSessionContextWorkaround()!.authManager.assumeSignedIn.client;

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
    tagTypes: ['Post'],
    endpoints: (builder) => ({
        getStatus: builder.query<NormalizedStatus, string>({
            query: (postId) => ({ action: 'get', kind: 'post', id: postId }),
            providesTags: (result, error, arg) => [{ type: 'Post', id: arg }],
            transformResponse(res: Status) {
                const { account, ...rest } = res;
                const accountEntity = accountAdapter.setOne(initialState, account);
                return { ...rest, account: accountEntity };
            }
        })
    })
})

//** Status but with some stuff normalized out, like account */
export type NormalizedStatus = Omit<Status, "account"> & { account: EntityState<Account, string> }


export const { getStatus } = apiSlice.endpoints;