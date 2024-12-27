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
    Show,
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
import { HomeFeedSource } from "~/components/feed/sources/homefeed";
import {
    AnyPropertyTextboxes,
    MultiTextbox,
    OrNullTextbox,
    Textbox,
} from "~/components/textbox";
import { Button } from "pillbug-components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "pillbug-components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "pillbug-components/ui/dropdown-menu";
import { useFeeds } from "~/lib/feed-manager";
import { useSettings } from "~/lib/settings-manager";
import { StoreBacked } from "~/lib/store-backed";
import { logger } from "~/logging";
import {
    IEditableRule,
    RuleActionSet,
    RuleEditor,
    RuleEvent,
} from "json-rules-editor";

type FeedSource = "homeTimeline";
class FeedBuilderFacetStore {
    constructor(
        public source: FeedSource = "homeTimeline",
        public rules: FeedRuleProperties[] = defaultFeedRules,
        public currentlyEditingFilterName: string | undefined = undefined,
        public openSelectedFilterName: string | undefined = undefined,
        public saveSelectedFilterName: string | undefined = undefined,
        public ioState: undefined | "opening" | "saving" = undefined,
        public feedbackMessage: undefined | string = undefined,
        public editorVisible: boolean = false
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

    const editingRules: Accessor<
        StoreBacked<IEditableRule<FeedRuleEventType>[]>
    > = createMemo(() => {
        const fsr = facetStore.rules;
        //const rules = unwrap(fsr).map((r) => r.build());
        return new StoreBacked<FeedRuleProperties[]>(fsr);
    });
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

    const manifest = {
        source: new HomeFeedSource(useAuth(), useSettings()),
        fetchReferencedPosts: 5, // unused??
        postsPerPage: 10,
        postsToFetchPerBatch: 40,
    };

    return (
        <div
            id="notifications-facet"
            class={"post-content" /* hack so we get list styles.. */}
        >
            <div class="pbCard">
                <div>{facetStore.feedbackMessage}</div>
                <Switch>
                    <Match when={facetStore.ioState === undefined}>
                        <div style="display: inline-block; padding-left: 1em; padding-right: 1em;">
                            current filter:{" "}
                            {facetStore.currentlyEditingFilterName ?? "default"}
                        </div>
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
                        <Button
                            onClick={() => {
                                setFacetStore(
                                    "editorVisible",
                                    !facetStore.editorVisible
                                );
                            }}
                        >
                            Toggle editor
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
                                            r.event,
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
                            onClick={() => setFacetStore("ioState", undefined)}
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
                                        logger.error("error saving", e);
                                    }
                                }
                            }}
                        >
                            Save
                        </Button>
                        <Button
                            onClick={() => setFacetStore("ioState", undefined)}
                            class="redButton"
                        >
                            Cancel
                        </Button>
                    </Match>
                    <Match when={false /* not actually using this stuff */}>
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
                    </Match>
                </Switch>
            </div>

            <Show when={facetStore.editorVisible}>
                <Card>
                    <CardHeader>
                        <CardTitle>Editor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FeedEditorComponent rules={editingRules()} />
                    </CardContent>
                    <CardFooter>
                        <Button
                            onClick={() => {
                                setFacetStore("rules", toFeedRules());
                            }}
                        >
                            Reapply rules
                        </Button>
                    </CardFooter>
                </Card>
            </Show>

            <div>
                <FeedComponent
                    manifest={manifest}
                    rules={facetStore.rules}
                    initialOptions={{ limit: 25 }}
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

class FeedEditorClass extends RuleEditor<FeedRuleEventType, StatusFact> {
    defaultRule(): IEditableRule<FeedRuleEventType> {
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
        return new FeedRuleProperties(
            "newly created rule",
            {
                all: [defaultCondition()],
            },
            {
                type: defaultAction,
                params: eventParams,
            }
        );
    }
    defaultCondition(): ConditionProperties {
        return {
            fact: "spoiler_text",
            operator: "equal",
            value: "test",
        };
    }
    getAvailableActions(): RuleActionSet<FeedRuleEventType> {
        return FeedRuleActions;
    }
    getConditionFactChoices() {
        return {
            in_reply_to_id: {
                label: "in_reply_to_id",
            },
            favourited: { label: "favourited" },
            reblogged: { label: "reblogged" },
            "sensitive flag": { label: "sensitive" },
            "cw text": { label: "cw text" },
        };
    }
}

const feedEditorInstance = new FeedEditorClass();
const FeedEditorComponent = feedEditorInstance.editorComponent();

function defaultCondition(): ConditionProperties {
    return {
        fact: "spoiler_text",
        operator: "equal",
        value: "test",
    };
}

type StatusFact =
    | Pick<
          Status,
          | "in_reply_to_id"
          | "favourited"
          | "reblogged"
          | "sensitive"
          | "spoiler_text"
      >
    | { tagList: [] };

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
