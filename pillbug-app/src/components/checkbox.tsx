import { Accessor, Component, JSX, Setter, createUniqueId } from "solid-js";

export const Checkbox: Component<{
    getter: Accessor<boolean>;
    setter: Setter<boolean> | ((b: boolean) => void);
    children: JSX.Element;
}> = (props) => {
    const id = createUniqueId();
    const checkboxId = `checkbox-${id}`;

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
