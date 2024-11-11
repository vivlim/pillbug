import {
    Accessor,
    Component,
    For,
    JSX,
    Setter,
    Show,
    createEffect,
    createSignal,
    createUniqueId,
} from "solid-js";

export const DropdownOrOther: Component<{
    id: string;
    getter: Accessor<boolean>;
    setter: Setter<boolean> | ((b: boolean) => void);
    children: JSX.Element;
}> = (props) => {
    const checkboxId = `checkbox-${props.id}`;

    return (
        <>
            <input
                type="checkbox"
                id={checkboxId}
                checked={props.getter()}
                onChange={(e) => props.setter(e.currentTarget.checked)}
            />
            <label for={checkboxId} class="pl-2 select-none">
                {props.children}
            </label>
        </>
    );
};

export interface DropdownOrOtherComponentProps<T extends string> {
    value: T | string;
    setter: (arg0: T | string) => void;
    children: JSX.Element;
    allowOther: boolean;
    choices: Record<T, DropdownChoice>;
    otherLabel?: string;
    otherPlaceholder?: string;
}

export type DropdownChoice = {
    label: string;
};

export function DropdownOrOtherComponentBuilder<T extends string>(
    props: DropdownOrOtherComponentProps<T>
): JSX.Element {
    const uniqueId = createUniqueId();
    const elementId = `dropdown-${uniqueId}`;
    const choices = Object.keys(props.choices) as T[];
    const [otherValue, setOtherValue] = createSignal<string>(props.value);

    const getSelectedIndexForOption = (): number => {
        const index = choices.indexOf(props.value as T);
        if (index === -1) {
            if (props.allowOther) {
                return choices.length;
            }

            // not allowing other? choose the 0th option
            return 0;
        }

        return index;
    };

    const getOptionForIndex: (i: number) => T | string = (i) => {
        if (i === choices.length && props.allowOther) {
            const ov = otherValue();
            return ov;
        }
        if (i >= choices.length || i < 0) {
            return choices[0];
        }

        return choices[i];
    };

    const [selectedIndex, setSelectedIndex] = createSignal<number>(
        getSelectedIndexForOption()
    );

    createEffect(() => {
        const selectedOption: string | T = getOptionForIndex(selectedIndex());
        if (props.value !== selectedOption) {
            props.setter(selectedOption);
        }
    });

    return (
        <>
            <label for={elementId} class="pl-2 select-none">
                {props.children}
            </label>
            <select
                id={elementId}
                onChange={(e: {
                    currentTarget: HTMLSelectElement;
                    target: Element;
                }) => {
                    setSelectedIndex(parseInt(e.currentTarget.value));
                }}
                class="pbInput"
            >
                <For each={choices}>
                    {(choice, idx) => {
                        return (
                            <option
                                value={idx()}
                                selected={selectedIndex() === idx()}
                            >
                                {props.choices[choice].label}
                            </option>
                        );
                    }}
                </For>
                <Show when={props.allowOther}>
                    <option
                        value={choices.length}
                        selected={selectedIndex() === choices.length}
                    >
                        {props.otherLabel ?? "other"}
                    </option>
                </Show>
            </select>
            <Show when={props.allowOther && selectedIndex() == choices.length}>
                <input
                    type="text"
                    class="pbInput"
                    value={otherValue()}
                    onChange={(e: { currentTarget: HTMLInputElement }) => {
                        setOtherValue(e.currentTarget.value);
                    }}
                    placeholder={props.otherPlaceholder}
                ></input>
            </Show>
        </>
    );
}

export const StringChoiceDropdown: Component<
    DropdownOrOtherComponentProps<string>
> = (p) => DropdownOrOtherComponentBuilder<string>(p);


export interface IndexDropdownProps {
    value: number;
    setter: (arg0: number) => void;
    children: JSX.Element;
    labels: string[];
}
export const IndexDropdown: Component<IndexDropdownProps> = (props) => {
    const uniqueId = createUniqueId();
    const elementId = `dropdown-${uniqueId}`;

    const [selectedIndex, setSelectedIndex] = createSignal<number>(props.value);

    return (
        <>
            <label for={elementId} class="pl-2 select-none">
                {props.children}
            </label>
            <select
                id={elementId}
                onChange={(e: {
                    currentTarget: HTMLSelectElement;
                    target: Element;
                }) => {
                    const selectedIndex = parseInt(e.currentTarget.value);
                    setSelectedIndex(selectedIndex);
                    props.setter(selectedIndex);
                }}
                class="pbInput"
            >
                <For each={props.labels}>
                    {(label, idx) => {
                        return (
                            <option
                                value={idx()}
                                selected={selectedIndex() === idx()}
                            >
                                {label}
                            </option>
                        );
                    }}
                </For>
            </select>
        </>
    );
};