import { FeedRuleProperties } from "./feed-engine";

export const defaultFeedRules: FeedRuleProperties[] = [
    new FeedRuleProperties(
        "hide replies from feed",
        {
            all: [
                {
                    fact: "in_reply_to_id",
                    operator: "equal",
                    value: null,
                }
            ]
        },
        { type: "hidePost" }
    ),
]

/* just an example i don't have somewhere better to stash atm

    new FeedRuleProperties(
        "label other pillbug enjoyers",
        {
            all: [
                {
                    fact: "application",
                    operator: "equal",
                    path: "$.name",
                    value: "pillbug",
                }
            ]
        },
        { type: "applyLabel", params: { label: "pillbug enjoyer" } }
    )
*/