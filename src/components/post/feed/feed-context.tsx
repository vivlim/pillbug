import { Status } from "megalodon/lib/src/entities/status";
import { createContext, Resource, ResourceActions, useContext } from "solid-js";

export interface FeedContextValue {
    postList: Resource<Status[] | undefined>;
    postListActions: ResourceActions<Status[] | undefined>;
    resetFeed: () => void;
}

export const FeedContext = createContext<FeedContextValue>();

export function useFeedContext() {
    const context = useContext(FeedContext);
    if (context == undefined) {
        throw new Error(
            "useFeedContext must be used within a <PostFeed> component (a new version of pillbug may have been deployed; try refreshing)"
        );
    }
    return context;
}
