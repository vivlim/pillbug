import { FeedRuleProperties } from "./feed-engine";

export const defaultFeedRules: FeedRuleProperties[] = [
    new FeedRuleProperties(
        "hide replies from feed",
        {
            all: [
                {
                    fact: "in_reply_to_id",
                    operator: "notEqual",
                    value: null,
                }
            ]
        },
        { type: "hidePost" }
    ),

    new FeedRuleProperties(
        "label posts written with pillbug",
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
        { type: "applyLabel", params: { label: "pillbug" } }
    )
]