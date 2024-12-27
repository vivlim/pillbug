import { Component, createSignal, JSX, Match, Show, Switch } from "solid-js";
import { TextField, TextFieldTextArea } from "pillbug-components/ui/text-field";

export interface RawDataViewerProps {
    data: any;
    show: boolean;
}

export const RawDataViewer: Component<RawDataViewerProps> = (props) => {
    return (
        <Show when={props.show}>
            <div class="p-3 border-t">
                <TextField>
                    <TextFieldTextArea
                        readOnly={true}
                        class="h-[40vh]"
                        value={JSON.stringify(props.data, null, 2)}
                    ></TextFieldTextArea>
                </TextField>
            </div>
        </Show>
    );
};
