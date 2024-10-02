import { type Component } from "solid-js";
import { useEditOverlayContext } from "~/lib/edit-overlay-context";
import { useAuthContext } from "~/lib/auth-context";
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
