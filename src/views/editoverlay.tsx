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
} from "~/components/ui/text-field";

const EditOverlay: Component = () => {
    const authContext = useAuthContext();
    const editingOverlayContext = useEditOverlayContext();

    const handleOnOpenChange = (newState: boolean) => {
        // todo check if there are unsaved changes and ask for confirmation.
        editingOverlayContext.setShowingEditorOverlay(newState);
    };

    return (
        <Dialog
            open={editingOverlayContext.showingEditorOverlay()}
            onOpenChange={handleOnOpenChange}
        >
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New post</DialogTitle>
                    <DialogDescription>write your cool post</DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <TextField class="grid grid-cols-4 items-center gap-4">
                        <TextFieldLabel class="text-right">Name</TextFieldLabel>
                        <TextFieldInput
                            value="sup"
                            class="col-span-3"
                            type="text"
                        />
                    </TextField>
                </div>
                <DialogFooter>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditOverlay;
