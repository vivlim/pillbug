/* @refresh reload */
import { ErrorBoundary, render } from "solid-js/web";

import { lazy } from "solid-js";
import { RuleEditor } from "./editor";
import {
    RuleProperties,
    ConditionProperties,
    TopLevelCondition,
} from "json-rules-engine";
import { FactChoice, IEditableRule, RuleActionSet, RuleEvent } from "./types";
import { createStore } from "solid-js/store";
import { StoreBacked } from "pillbug-app/lib/store-backed";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error(
        "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
    );
}

type TestRuleEventType = "TypeA" | "TypeB" | "TypeC";
type TestRuleFactChoice = "FactA" | "FactB" | "FactC" | { tags: string[] };

class TestEditorClass extends RuleEditor<
    TestRuleEventType,
    TestRuleFactChoice
> {
    defaultRule(): TestEditableRule {
        return new TestEditableRule(
            "a newly created rule",
            {
                all: [
                    {
                        fact: "Fact A",
                        operator: "equal",
                        value: "defaultValue",
                    },
                ],
            },
            {
                type: "TypeA",
            }
        );
        /*
        return {
            conditions: {
                all: [this.defaultCondition()],
            },
            event: {
                type: "TypeA",
                params: {},
            },
        };
        */
    }
    defaultCondition(): ConditionProperties {
        return {
            fact: "FactA",
            operator: "equal",
            value: "test",
        };
    }
    getAvailableActions(): RuleActionSet<TestRuleEventType> {
        // TODO: RuleActionSet bound doesn't require all the types to be present.
        return {
            TypeA: {
                label: "Type A",
                stringParams: [],
            },
            TypeB: {
                label: "Type B",
                stringParams: [],
            },
            TypeC: {
                label: "Type C",
                stringParams: [],
            },
        };
    }
    getConditionFactChoices(): FactChoice<TestRuleFactChoice> {
        return {
            FactA: {
                label: "Fact A",
            },
        };
    }
}

const editorInstance = new TestEditorClass();
const TestEditorComponent = editorInstance.editorComponent();

export class TestEditableRule implements IEditableRule<TestRuleEventType> {
    constructor(
        public description: string,
        public conditions: TopLevelCondition,
        public event: RuleEvent<TestRuleEventType>,
        public enabled: boolean = true,
        public name?: string,
        public priority?: number
    ) {}

    public build(): RuleProperties {
        return {
            conditions: this.conditions,
            event: this.event,
            name: this.name,
            priority: this.priority,
        };
    }
}
const initialRules: TestEditableRule[] = [
    new TestEditableRule(
        "a rule checking fact a is hello",
        {
            all: [
                {
                    fact: "Fact A",
                    operator: "equal",
                    value: "hello",
                },
            ],
        },
        { type: "TypeA" }
    ),
];

type TestRulesStoreType = {
    rules: TestEditableRule[];
};

const editingRules = new StoreBacked<TestEditableRule[]>(initialRules);

render(() => {
    return (
        <ErrorBoundary fallback={(e) => <div>error: {e.message}</div>}>
            <div>hello world</div>
            <TestEditorComponent rules={editingRules} />
        </ErrorBoundary>
    );
}, root!);
