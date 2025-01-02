import { createEntityAdapter, createSlice, EntityId, isAnyOf, PayloadAction, UnknownAction } from "@reduxjs/toolkit";
import { apiSlice, cachedMegalodonApiEndpoint, MegalodonCachedMethods, MegalodonCachedMethodsType } from "../api/apiSlice";
import { Status } from "megalodon/lib/src/entities/status";
import { MegalodonInterface } from "megalodon";
import { logger } from "~/logging";
import { inherits } from "util";
import { Account } from "megalodon/lib/src/entities/account";
import { RootState } from "~/state/store";

export type PostRelationshipKinds = typeof PostRelationshipTemplate;

/*** Template for post relationships. Use empty strings, they will be augmented to allow undefined and null. */
const PostRelationshipTemplate = {
    linkedParent: '' as string,
    reblogOf: '' as string,
    rebloggedBy: [''] as string[],
} as const;

export type PostRelationship = EntityId | undefined | null

/** A map of relationships to other posts. Undefined: unknown. Null: known to not exist. */
export type PostRelationships = {
    -readonly [Property in keyof typeof PostRelationshipTemplate]: typeof PostRelationshipTemplate[Property] | undefined | null
}

export interface Post {
    id: string;
    status: NormalizedStatus;
    relationships: PostRelationships;
}

interface NormalizedStatus extends Omit<Status, 'account' | 'reblog'> {
    account: string,
}

const postAdapter = createEntityAdapter<Post>({})
const userAdapter = createEntityAdapter<Account>({})

const initialState = {
    posts: postAdapter.getInitialState(),
    users: userAdapter.getInitialState()
}

type StatusNormalizationOutputs = {
    posts: Post[];
    authors: Account[];
}

function normalizeStatus(status: Status, rebloggedBy?: string | undefined): StatusNormalizationOutputs {
    const posts: Post[] = [];
    const users: Account[] = [];

    const { account, reblog, ...rest } = status;

    const relationships: PostRelationships = {
        reblogOf: null, // Default to asserting it's not a reblog, mutate this if it actually is.
        linkedParent: undefined, // We don't know without first parsing the post's content.
        rebloggedBy: rebloggedBy === undefined ? null : [rebloggedBy], // Unless a 'reblogged by
    }

    if (reblog) {
        relationships.reblogOf = reblog.id;
        const nested = normalizeStatus(reblog, rest.id);
        posts.concat(nested.posts)
        users.concat(nested.authors)
    }

    // add property. yet another copy, but operates within the type system making it safer if i refactor
    const normalizedStatus = { ...rest, account: account.id };

    posts.push({
        id: rest.id, status: normalizedStatus, relationships
    })
    users.push(account)

    return { posts, authors: users }
}

function flatten(x: StatusNormalizationOutputs[]): StatusNormalizationOutputs {
    return x.reduce((prev, current) => {
        prev.authors.push(...current.authors);
        prev.posts.push(...current.posts);
        return prev;
    }, {
        authors: [],
        posts: []
    })

}

/** Narrows down the type of the api response based on the method that was called. Mapped type -> union */
type MegalodonApiResponse = {
    [Property in keyof MegalodonInterface]: {
        method: Property;
        result: Awaited<ReturnType<MegalodonInterface[Property]>>;
    }
}[MegalodonCachedMethodsType]

/** Pulls Post objects out of api responses. */
function extractPostsFromApiResponse(response: MegalodonApiResponse): { posts: Post[], authors: Account[] } {
    if (response.method === 'getHomeTimeline') {
        response.method
        return flatten(response.result.data.map(status => normalizeStatus(status)))
    } else if (response.method === 'search') {
        response.result.data

    }
    return { posts: [], authors: [] }
}

export const entityGraphSlice = createSlice({
    name: 'entityGraph',
    initialState,
    reducers: {
        //storeDiscoveredPosts(state, action: PayloadAction<Post[]>)

    },
    extraReducers(builder) {
        builder.addMatcher(cachedMegalodonApiEndpoint.matchFulfilled, (state, action) => {
            // When a cached api call is made, check if it contains any posts we can store.
            const megalodonMethod = action.meta.arg.originalArgs._method
            // TODO: If the posts are already stored, just update those instead of re-normalizing them
            const extractedPosts = extractPostsFromApiResponse({ method: megalodonMethod, result: action.payload })
            postAdapter.setAll(state.posts, extractedPosts.posts)
            userAdapter.setAll(state.users, extractedPosts.authors)
        })
    }
})

export const postSelectors = postAdapter.getSelectors<RootState>((state) => state.entityGraph.posts)