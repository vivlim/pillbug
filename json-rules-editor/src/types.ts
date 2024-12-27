import { RuleProperties, TopLevelCondition } from "json-rules-engine";

export type MultiTextboxSpec = { // Also exported from textbox.tsx...
    key: string;
    label: string;
    description: string;
    defaultValue: string;
};

export interface RuleActionParam extends MultiTextboxSpec {
}

export type RuleAction<TEventType extends RuleEventType<TEventType>> = {
    label: string; // Can this be RuleEventType? not sure.
    stringParams: RuleActionParam[];
}

type IsUnion<T, U extends T = T> =
    (T extends any ?
        (U extends T ? false : true)
        : never) extends false ? false : true

export type RuleEventType<TSelf> = IsUnion<TSelf> extends true ? any : never;
export type FactChoice<TSelf> = IsUnion<TSelf> extends true ? any : never;
export interface RuleEvent<TEventType extends RuleEventType<TEventType>> {
    type: TEventType;
    params?: any;
}

export type RuleActionSet<TEventType extends RuleEventType<TEventType>> = Record<RuleEventType<TEventType>, RuleAction<TEventType>>

export type FactChoiceSet<TFact extends FactChoice<TFact>> = Record<FactChoice<TFact>, RuleAction<TFact>>


export interface IEditableRule<TEventType extends RuleEventType<TEventType>> {
    description: string,
    conditions: TopLevelCondition,
    event: RuleEvent<TEventType>,
    enabled: boolean,
    name?: string,
    priority?: number
    build(): RuleProperties
}