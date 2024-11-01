import { produce } from "solid-js/store";
import { PersistentStoreBacked } from "./store-backed";
import { useSessionContext } from "./session-context";
import { createEffect } from "solid-js";
import { FeedRule, FeedRuleProperties } from "~/components/feed/feed-engine";

export function useFeeds(): FeedManager {
    const sessionContext = useSessionContext();
    return sessionContext.feedManager;
}

export interface SessionFeedState {
    currentHomeFeed?: string;
}

export interface FeedConfiguration extends Record<string, FeedFilter> {
}
export interface FeedFilter {
    /** label is also here so it can be used as a DropdownChoice */
    label: string;
    rules: FeedRule[]
}

export class FeedManager extends PersistentStoreBacked<SessionFeedState, FeedConfiguration> {

    constructor() {
        super({}, {}, { name: "pillbug-feeds" });

    }
}