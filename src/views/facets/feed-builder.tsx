import {
    AllConditions,
    ConditionProperties,
    NestedCondition,
    RuleProperties,
    TopLevelCondition,
} from "json-rules-engine";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Accessor,
    Component,
    For,
    Match,
    Switch,
    createEffect,
    createMemo,
} from "solid-js";
import {
    SetStoreFunction,
    createStore,
    produce,
    reconcile,
    unwrap,
} from "solid-js/store";
import { useAuth } from "~/auth/auth-manager";
import {
    DropdownOrOtherComponentBuilder,
    DropdownOrOtherComponentProps,
    StringChoiceDropdown,
} from "~/components/dropdown-or-other";
import { FeedComponent } from "~/components/feed";
import {
    FeedRuleActions,
    FeedRuleEvent,
    FeedRuleEventType,
    FeedRuleProperties,
} from "~/components/feed/feed-engine";
import { defaultFeedRules } from "~/components/feed/preset-rules";
import {
    AnyPropertyTextboxes,
    MultiTextbox,
    OrNullTextbox,
    Textbox,
} from "~/components/textbox";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useFeeds } from "~/lib/feed-manager";
import { StoreBacked } from "~/lib/store-backed";

type FeedSource = "homeTimeline";
class FeedBuilderFacetStore {
    constructor(
        public source: FeedSource = "homeTimeline",
        public rules: FeedRuleProperties[] = defaultFeedRules,
        public currentlyEditingFilterName: string | undefined = undefined,
        public openSelectedFilterName: string | undefined = undefined,
        public saveSelectedFilterName: string | undefined = undefined,
        public ioState: undefined | "opening" | "saving" = undefined,
        public feedbackMessage: undefined | string = undefined
    ) {}
}

const initialRule: FeedRuleProperties = new FeedRuleProperties(
    "testing rule",
    {
        all: [
            {
                fact: "in_reply_to_id",
                operator: "equal",
                value: null,
            },
        ],
    },
    { type: "applyLabel", params: { label: "non-reply" } }
);

const FeedBuilderFacet: Component = (props) => {
    const feedManager = useFeeds();
    const [facetStore, setFacetStore] = createStore<FeedBuilderFacetStore>(
        new FeedBuilderFacetStore()
    );

    const availableFeeds = createMemo(() => {
        const f = feedManager.persistentStore.filters;
        if (f === undefined) {
            return [];
        }
        return Object.keys(f);
    });

    const editingRules: Accessor<StoreBacked<RuleProperties[]>> = createMemo(
        () => {
            const rules = unwrap(facetStore.rules).map((r) => r.build());
            return new StoreBacked<RuleProperties[]>(rules);
        }
    );
    // TODO: don't transform feedruleproperties to be able to edit them.
    const toFeedRules: () => FeedRuleProperties[] = () => {
        return unwrap(editingRules().store).map(
            (r) =>
                new FeedRuleProperties(
                    "placeholder description",
                    r.conditions,
                    r.event as FeedRuleEvent,
                    true,
                    r.name,
                    r.priority
                )
        );
    };

    return (
        <div
            id="notifications-facet"
            class={"post-content" /* hack so we get list styles.. */}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Feed builder</CardTitle>
                </CardHeader>
                <CardContent>
                    <div>{facetStore.feedbackMessage}</div>
                    <Switch>
                        <Match when={facetStore.ioState === undefined}>
                            <Button
                                onClick={() => {
                                    setFacetStore("feedbackMessage", undefined);
                                    setFacetStore("ioState", "opening");
                                }}
                            >
                                Open a filter
                            </Button>
                            <Button
                                onClick={() => {
                                    setFacetStore("feedbackMessage", undefined);
                                    setFacetStore("ioState", "saving");
                                }}
                            >
                                Save filter
                            </Button>
                        </Match>
                        <Match when={facetStore.ioState === "opening"}>
                            <StringChoiceDropdown
                                choices={feedManager.persistentStore ?? {}}
                                allowOther={false}
                                value={facetStore.openSelectedFilterName ?? ""}
                                setter={(f) =>
                                    setFacetStore("openSelectedFilterName", f)
                                }
                            >
                                Open filter
                            </StringChoiceDropdown>
                            <Button
                                onClick={() => {
                                    if (!facetStore.openSelectedFilterName) {
                                        setFacetStore(
                                            "feedbackMessage",
                                            "can't open feed when there isn't one selected"
                                        );
                                        return;
                                    }

                                    var filter =
                                        feedManager.persistentStore[
                                            facetStore.openSelectedFilterName
                                        ];
                                    if (filter === undefined) {
                                        setFacetStore(
                                            "feedbackMessage",
                                            `the feed ${facetStore.openSelectedFilterName} doesn't actually exist?`
                                        );
                                        return;
                                    }
                                    // todo, directly use filter here instead of breaking it apart?
                                    setFacetStore(
                                        "currentlyEditingFilterName",
                                        filter.label
                                    );
                                    const rules = filter.rules.map(
                                        (r) =>
                                            new FeedRuleProperties(
                                                r.description,
                                                r.conditions,
                                                r.ev,
                                                r.enabled,
                                                r.name,
                                                r.priority
                                            )
                                    );
                                    setFacetStore("rules", rules);
                                    setFacetStore("rules", rules);
                                    setFacetStore("rules", rules);
                                    setFacetStore(
                                        "feedbackMessage",
                                        `opened ${filter.label}`
                                    );
                                    setFacetStore("ioState", undefined);
                                }}
                            >
                                Open
                            </Button>
                            <Button
                                onClick={() =>
                                    setFacetStore("ioState", undefined)
                                }
                                class="redButton"
                            >
                                Cancel
                            </Button>
                        </Match>
                        <Match when={facetStore.ioState === "saving"}>
                            <StringChoiceDropdown
                                choices={feedManager.persistentStore ?? {}}
                                allowOther={true}
                                otherLabel="(new filter)"
                                otherPlaceholder="name the new filter"
                                value={facetStore.saveSelectedFilterName ?? ""}
                                setter={(f) =>
                                    setFacetStore("saveSelectedFilterName", f)
                                }
                            >
                                Save over filter
                            </StringChoiceDropdown>
                            <Button
                                onClick={() => {
                                    try {
                                        const name =
                                            facetStore.saveSelectedFilterName;
                                        if (name === undefined || "") {
                                            setFacetStore(
                                                "feedbackMessage",
                                                "you must specify a name for the filter"
                                            );
                                            return;
                                        }
                                        feedManager.setPersistentStore(name, {
                                            label: name,
                                            rules: facetStore.rules,
                                        });
                                        setFacetStore(
                                            "feedbackMessage",
                                            `saved as ${name}`
                                        );
                                        setFacetStore("ioState", undefined);
                                    } catch (e) {
                                        if (e instanceof Error) {
                                            setFacetStore(
                                                "feedbackMessage",
                                                "save failed: " + e.message
                                            );
                                            console.error(
                                                "error saving: " + e.stack ??
                                                    e.message
                                            );
                                        }
                                    }
                                }}
                            >
                                Save
                            </Button>
                            <Button
                                onClick={() =>
                                    setFacetStore("ioState", undefined)
                                }
                                class="redButton"
                            >
                                Cancel
                            </Button>
                        </Match>
                    </Switch>
                    <ul>
                        <li>
                            Source:
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    type="button"
                                    class="border-2 p-2 m-1 rounded-md"
                                >
                                    {facetStore.source}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent class="w-48">
                                    <DropdownMenuRadioGroup
                                        value={facetStore.source}
                                        onChange={(val) => {
                                            setFacetStore(
                                                "source",
                                                val as FeedSource
                                            );
                                        }}
                                    >
                                        <DropdownMenuRadioItem value="homeTimeline">
                                            home timeline
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="comment">
                                            comment
                                        </DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="share">
                                            share
                                        </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </li>
                    </ul>
                    <Button
                        onClick={() => {
                            setFacetStore("rules", toFeedRules());
                        }}
                    >
                        Apply rules
                    </Button>
                </CardContent>
                <CardFooter></CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Editor</CardTitle>
                </CardHeader>
                <CardContent>
                    <FeedRulesEditorComponent rules={editingRules()} />
                </CardContent>
                <CardFooter></CardFooter>
            </Card>

            <hr />

            <div>
                <FeedComponent
                    rules={facetStore.rules}
                    initialOptions={{ limit: 25 }}
                    onRequest={async (o) => {
                        return await useAuth().assumeSignedIn.client.getHomeTimeline(
                            o
                        );
                    }}
                />
            </div>
        </div>
    );
};

type FeedRulesEditorProps = { rules: StoreBacked<RuleProperties[]> };
type FeedRulesEditorUpdaterFn = () => void;

class FeedRuleset {
    constructor(public rules: RuleProperties[]) {}
}
const FeedRulesEditorComponent: Component<FeedRulesEditorProps> = (props) => {
    const ruleStore = props.rules;
    // deep clone the rules so that they can be mutated directly and reconciled against the store contents
    const ruleState = createMemo(
        () =>
            JSON.parse(
                JSON.stringify(ruleStore.store)
            ) as unknown as RuleProperties[]
    );
    const updater: FeedRulesEditorUpdaterFn = () => {
        ruleStore.setStore(reconcile(ruleState()));
    };

    return (
        <>
            <For each={ruleState()}>
                {(rule, idx) => {
                    const action =
                        FeedRuleActions[rule.event.type as FeedRuleEventType];
                    return (
                        <ul class="rule">
                            <li class="condition">
                                <ConditionComponent
                                    condition={rule.conditions}
                                    updater={updater}
                                />
                            </li>
                            <li class="action">
                                <ActionDropdown
                                    allowOther={false}
                                    choices={FeedRuleActions}
                                    value={rule.event.type}
                                    setter={(t) => {
                                        if (t !== rule.event.type) {
                                            const eventParams: any = {};
                                            const newAction =
                                                FeedRuleActions[
                                                    t as FeedRuleEventType
                                                ];
                                            for (const sp of newAction.stringParams) {
                                                eventParams[sp.key] =
                                                    sp.defaultValue;
                                            }
                                            rule.event.type = t;
                                            rule.event.params = eventParams;
                                            updater();
                                        }
                                    }}
                                >
                                    <MultiTextbox
                                        specs={action.stringParams}
                                        value={rule.event.params}
                                        setter={(k, v) => {
                                            if (
                                                rule.event.params === undefined
                                            ) {
                                                rule.event.params = {};
                                            }
                                            rule.event.params[k] = v;
                                            updater();
                                        }}
                                    />
                                </ActionDropdown>
                            </li>
                        </ul>
                    );
                }}
            </For>
            <Button
                onClick={() => {
                    ruleState().push(defaultRule());
                    updater();
                }}
            >
                Add rule
            </Button>
        </>
    );
};

function defaultCondition(): ConditionProperties {
    return {
        fact: "spoiler_text",
        operator: "equal",
        value: "test",
    };
}

function defaultRule(): RuleProperties {
    const defaultAction: keyof typeof FeedRuleActions = "collapsePost";

    const eventParams: any = {};
    for (const sp of FeedRuleActions[defaultAction].stringParams) {
        eventParams[sp.key] = sp.defaultValue;
    }
    const newRule: RuleProperties = {
        conditions: {
            all: [defaultCondition()],
        },
        event: {
            type: defaultAction,
            params: eventParams,
        },
    };
    return newRule;
}

const ConditionComponent: Component<{
    condition: NestedCondition;
    updater: FeedRulesEditorUpdaterFn;
}> = (props) => {
    if ("all" in props.condition) {
        return (
            <ul class="allCondition">
                ALL:
                <Button
                    onClick={() => {
                        const c = props.condition as AllConditions;
                        c.all.push(defaultCondition());
                        props.updater();
                    }}
                >
                    +
                </Button>
                <NestedConditionComponent
                    conditions={props.condition.all}
                    updater={props.updater}
                />
            </ul>
        );
    } else if ("any" in props.condition) {
        return (
            <ul class="anyCondition">
                ANY:
                <NestedConditionComponent
                    conditions={props.condition.any}
                    updater={props.updater}
                />
            </ul>
        );
    } else if ("not" in props.condition) {
        return (
            <ul class="notCondition">
                NOT:
                <NestedConditionComponent
                    conditions={[props.condition.not]}
                    updater={props.updater}
                />
            </ul>
        );
    } else if ("condition" in props.condition) {
        return <p class="referenceCondition">reference (todo)</p>;
    }

    const c: ConditionProperties = props.condition;

    return (
        <ul class="conditionProperties">
            <li class="conditionFact">
                <FactDropdown
                    value={c.fact}
                    setter={(v) => {
                        c.fact = v;
                        props.updater();
                    }}
                    allowOther={true}
                    choices={{
                        sensitive: { label: "flagged as sensitive" },
                        spoiler_text: { label: "cw text" },
                        tagList: { label: "tag list" },
                        favourited: { label: "favourited" },
                        reblogged: { label: "reblogged" },
                        in_reply_to_id: { label: "reply to id" },
                    }}
                >
                    fact
                </FactDropdown>
            </li>
            <li class="conditionOperator">
                <OperatorDropdown
                    value={c.operator}
                    setter={(v) => {
                        c.operator = v;
                        props.updater();
                    }}
                    allowOther={false}
                    choices={{
                        equal: { label: "equals" },
                        notEqual: { label: "does not equal" },
                        contains: { label: "contains" },
                        doesNotContain: { label: "does not contain" },
                    }}
                >
                    operator
                </OperatorDropdown>
            </li>
            <li class="conditionValue">
                <OrNullTextbox
                    value={c.value}
                    setter={(v) => {
                        c.value = v;
                        props.updater();
                    }}
                >
                    value:
                </OrNullTextbox>
            </li>
        </ul>
    );
};
const NestedConditionComponent: Component<{
    conditions: NestedCondition[];
    updater: FeedRulesEditorUpdaterFn;
}> = (props) => {
    return (
        <For each={props.conditions}>
            {(item, idx) => {
                return (
                    <li>
                        <ConditionComponent
                            condition={item}
                            updater={props.updater}
                        />
                    </li>
                );
            }}
        </For>
    );
};

type StatusFactDropdown =
    | Pick<
          Status,
          | "in_reply_to_id"
          | "favourited"
          | "reblogged"
          | "sensitive"
          | "spoiler_text"
      >
    | { tagList: [] };
const FactDropdown: Component<
    DropdownOrOtherComponentProps<keyof StatusFactDropdown>
> = (p) => DropdownOrOtherComponentBuilder<keyof StatusFactDropdown>(p);

type Operators = "equal" | "notEqual" | "contains" | "doesNotContain";

const OperatorDropdown: Component<DropdownOrOtherComponentProps<Operators>> = (
    p
) => DropdownOrOtherComponentBuilder<Operators>(p);

const ActionDropdown: Component<
    DropdownOrOtherComponentProps<keyof typeof FeedRuleActions>
> = (p) => DropdownOrOtherComponentBuilder<keyof typeof FeedRuleActions>(p);


export default FeedBuilderFacet;
