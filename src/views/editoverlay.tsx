import { type Component } from "solid-js";
import { useAuthContext, useEditOverlayContext } from "~/App";
import EditDialog from "./editdialog";

const EditOverlay: Component = () => {
    const authContext = useAuthContext();
    const editingOverlayContext = useEditOverlayContext();

    const handleOnOpenChange = (newState: boolean) => {
        // todo check if there are unsaved changes and ask for confirmation.
        editingOverlayContext.setShowingEditorOverlay(newState);
    };

    return (
        <EditDialog
            open={editingOverlayContext.showingEditorOverlay()}
            onOpenChange={handleOnOpenChange}
        ></EditDialog>
    );
};

export default EditOverlay;
