import {
    AllConditions,
    ConditionProperties,
    NestedCondition,
    RuleProperties,
    TopLevelCondition,
} from "json-rules-engine";
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
import {
    DropdownOrOtherComponentBuilder,
    DropdownOrOtherComponentProps,
    StringChoiceDropdown,
} from "pillbug-app/components/dropdown-or-other";
import { defaultFeedRules } from "pillbug-app/components/feed/preset-rules";
import {
    AnyPropertyTextboxes,
    MultiTextbox,
    OrNullTextbox,
    Textbox,
} from "pillbug-app/components/textbox";
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
import { StoreBacked } from "pillbug-app/lib/store-backed";
import {
    RuleActionSet,
    FactChoice,
    RuleEventType,
    IEditableRule,
} from "./types";

// temporary hack. won't work in pillbug.
const logger = console.log;

type RulesEditorProps<TEventType extends RuleEventType<TEventType>> = {
    rules: StoreBacked<IEditableRule<TEventType>[]>;
};
type RulesEditorUpdaterFn = () => void;

export abstract class RuleEditor<
    TEventType extends RuleEventType<TEventType>,
    TFactChoice extends FactChoice<TFactChoice>
> {
    constructor() {}

    abstract defaultRule(): IEditableRule<TEventType>;
    abstract defaultCondition(): ConditionProperties;

    abstract getAvailableActions(): RuleActionSet<TEventType>; // TODO: should this have a parameter?

    abstract getConditionFactChoices(): FactChoice<TFactChoice>;

    public editorComponent(): Component<RulesEditorProps<TEventType>> {
        return (props) => {
            const ruleStore = props.rules;
            // deep clone the rules so that they can be mutated directly and reconciled against the store contents
            const ruleState = createMemo(
                () =>
                    JSON.parse(
                        JSON.stringify(ruleStore.store)
                    ) as unknown as IEditableRule<TEventType>[]
            );
            const updater: RulesEditorUpdaterFn = () => {
                ruleStore.setStore(reconcile(ruleState()));
            };

            const ConditionComponent = this.conditionComponent();
            const ActionDropdown = this.actionDropdownComponent();

            return (
                <>
                    <For each={ruleState()}>
                        {(rule, idx) => {
                            const availableActions = this.getAvailableActions();
                            const action =
                                availableActions[rule.event.type as TEventType];
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
                                            choices={this.getAvailableActions()}
                                            value={rule.event.type}
                                            setter={(t) => {
                                                if (t !== rule.event.type) {
                                                    const eventParams: any = {};
                                                    const newAction =
                                                        availableActions[
                                                            t as TEventType
                                                        ];
                                                    for (const sp of newAction.stringParams) {
                                                        eventParams[sp.key] =
                                                            sp.defaultValue;
                                                    }
                                                    rule.event.type =
                                                        t as TEventType;
                                                    rule.event.params =
                                                        eventParams;
                                                    updater();
                                                }
                                            }}
                                        >
                                            <MultiTextbox
                                                specs={action.stringParams}
                                                value={rule.event.params}
                                                setter={(k, v) => {
                                                    if (
                                                        rule.event.params ===
                                                        undefined
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
                            ruleState().push(this.defaultRule());
                            updater();
                        }}
                    >
                        Add rule
                    </Button>
                </>
            );
        };
    }

    conditionComponent(): Component<{
        condition: NestedCondition;
        updater: RulesEditorUpdaterFn;
    }> {
        return (props) => {
            const NestedConditionComponent = this.nestedConditionComponent();
            const FactDropdown = this.factDropdownComponent();
            if ("all" in props.condition) {
                return (
                    <ul class="allCondition">
                        ALL:
                        <Button
                            onClick={() => {
                                const c = props.condition as AllConditions;
                                c.all.push(this.defaultCondition());
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
                            choices={this.getConditionFactChoices()}
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
    }

    nestedConditionComponent(): Component<{
        conditions: NestedCondition[];
        updater: RulesEditorUpdaterFn;
    }> {
        return (props) => {
            const ConditionComponent = this.conditionComponent();
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
    }

    actionDropdownComponent(): Component<
        DropdownOrOtherComponentProps<TEventType>
    > {
        return (p) => DropdownOrOtherComponentBuilder<TEventType>(p);
    }

    factDropdownComponent(): Component<
        DropdownOrOtherComponentProps<TFactChoice>
    > {
        return (p) => DropdownOrOtherComponentBuilder<TFactChoice>(p);
    }
}

type Operators = "equal" | "notEqual" | "contains" | "doesNotContain";

const OperatorDropdown: Component<DropdownOrOtherComponentProps<Operators>> = (
    p
) => DropdownOrOtherComponentBuilder<Operators>(p);
