import { A, useParams } from "@solidjs/router";
import { Entity } from "megalodon";
import {
    createResource,
    createSignal,
    For,
    Setter,
    Show,
    type Component,
} from "solid-js";
import {
    AuthProviderProps,
    tryGetAuthenticatedClient,
    useAuthContext,
    useEditOverlayContext,
} from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import Post from "./post";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import {
    TextFieldLabel,
    TextFieldInput,
    TextField,
    TextFieldTextArea,
} from "~/components/ui/text-field";
import { DialogRootProps } from "@kobalte/core/dialog";

export interface EditDialogProps extends DialogRootProps {}

function onCwToggle(event: ToggleEvent) {
    console.log("toggle event: " + event.newState);
}

const EditDialog: Component<EditDialogProps> = (props) => {
    const authContext = useAuthContext();
    const [cwVisible, setCwVisible] = createSignal(false);

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent class="flex-grow flex-1 w-full">
                <DialogHeader>
                    <DialogTitle>New post</DialogTitle>
                </DialogHeader>
                <div class="flex flex-col py-3 gap-3">
                    <TextField class="border-none w-full flex-grow py-0 items-start justify-between min-h-24">
                        <TextFieldTextArea
                            tabindex="0"
                            placeholder="write your cool post"
                            class="resize-none overflow-hidden px-3 py-2 text-md"
                        ></TextFieldTextArea>
                    </TextField>
                    <TextField
                        class="border-none w-full flex-shrink"
                        hidden={!cwVisible()}
                    >
                        <TextFieldInput
                            type="text"
                            class="resize-none h-6 px-3 py-0 text-sm border-none rounded-none focus-visible:ring-0"
                            placeholder="content warnings"
                        ></TextFieldInput>
                    </TextField>
                </div>
                <DialogFooter>
                    <div class="flex-grow">
                        <button
                            type="button"
                            class="rounded-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            onClick={() => {
                                setCwVisible(!cwVisible());
                            }}
                        >
                            CW
                        </button>
                    </div>
                    <Button type="submit">Post</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditDialog;
