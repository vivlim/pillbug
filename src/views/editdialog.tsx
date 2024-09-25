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

const EditDialog: Component<EditDialogProps> = (props) => {
    const authContext = useAuthContext();

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent class="w-1/2 m-4">
                <DialogHeader>
                    <DialogTitle>New post</DialogTitle>
                    <DialogDescription>write your cool post</DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <TextField class="grid grid-cols-4 items-center gap-4">
                        <TextFieldTextArea
                            value="sup"
                            class="col-span-3"
                        ></TextFieldTextArea>
                    </TextField>
                </div>
                <DialogFooter>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditDialog;
