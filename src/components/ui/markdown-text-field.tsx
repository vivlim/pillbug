import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { minimalSetup } from "codemirror";
import { Component, createEffect, onCleanup, onMount } from "solid-js";

export interface MarkdownTextFieldProps {
    class?: string;
    placeholder?: string;
    disabled?: boolean;
    onValueChange?: (text: string) => void;
    onPaste?: (event: ClipboardEvent) => void;
    onSubmit?: () => void;
}
export const MarkdownTextField: Component<MarkdownTextFieldProps> = (props) => {
    let ref!: HTMLDivElement;

    onMount(() => {
        const disabledCompartment = new Compartment();
        const placeholderCompartment = new Compartment();
        const view = new EditorView({
            doc: "",
            parent: ref,
            extensions: [
                disabledCompartment.of([]),
                placeholderCompartment.of([]),
                keymap.of([
                    {
                        key: "Ctrl-Enter",
                        run: () => {
                            props.onSubmit?.();
                            return true; // consume keyevent
                        },
                    },
                ]),
                EditorView.domEventHandlers({
                    paste(event) {
                        props.onPaste?.(event);
                    },
                }),
                //TODO: this extension applies visual themes that look bad in dark mode :/
                //markdown({ base: markdownLanguage }),
                EditorView.lineWrapping,
                EditorView.theme({}, { dark: true }),
                minimalSetup,
            ],
            dispatchTransactions(trs, view) {
                view.update(trs);
                for (const transaction of trs) {
                    if (transaction.docChanged) {
                        const docText = transaction.state.doc.toString();
                        props.onValueChange?.(docText);
                    }
                }
            },
        });

        createEffect(() => {
            view.dispatch({
                effects: disabledCompartment.reconfigure(
                    props.disabled
                        ? [
                              EditorState.readOnly.of(true),
                              EditorView.editable.of(false),
                          ]
                        : []
                ),
            });
        });

        createEffect(() => {
            view.dispatch({
                effects: placeholderCompartment.reconfigure(
                    props.placeholder ? placeholder(props.placeholder) : []
                ),
            });
        });

        onCleanup(() => view.destroy());
    });

    return <div id="codemirror" class={props.class} ref={ref} />;
};
