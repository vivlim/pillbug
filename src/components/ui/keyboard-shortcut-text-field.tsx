import {
    Accessor,
    Component,
    ComponentProps,
    createMemo,
    JSX,
    Setter,
    splitProps,
    ValidComponent,
} from "solid-js";
import {
    TextFieldInput,
    TextFieldInputProps,
    TextFieldTextArea,
    TextFieldTextAreaProps,
} from "./text-field";
import { createKeybindingsHandler, KeyBindingMap } from "tinykeys";

export interface KeyboardShortcutTextAreaProps {
    shortcuts: KeyBindingMap;
    tabindex: number;
    placeholder: string;
    class: string;
    disabled?: boolean | undefined;
    setValue: (s: string) => void;
    value: string;
    onPaste?: (e: ClipboardEvent) => void;
}
export const KeyboardShortcutTextArea: Component<
    KeyboardShortcutTextAreaProps
> = (props) => {
    const [, rest] = splitProps(props, ["shortcuts", "setValue"]);

    const handler = createMemo(() => {
        return createKeybindingsHandler(props.shortcuts);
    });

    return (
        <TextFieldTextArea
            {...rest}
            onInput={(e) => {
                props.setValue(e.currentTarget.value);
            }}
            onKeyDown={handler()}
            onPaste={props.onPaste}
        />
    );
};
