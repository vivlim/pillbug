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
                        other
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
                ></input>
            </Show>
        </>
    );
}