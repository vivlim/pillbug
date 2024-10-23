import { Accessor, Component, JSX, Setter } from "solid-js";

export const Checkbox: Component<{
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
