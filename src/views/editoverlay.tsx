import { type Component } from "solid-js";
import { useEditOverlayContext } from "~/lib/edit-overlay-context";
import { useAuthContext } from "~/lib/auth-context";
import EditDialog from "./editdialog";
import { useNavigate } from "@solidjs/router";

const EditOverlay: Component = () => {
    const authContext = useAuthContext();
    const editingOverlayContext = useEditOverlayContext();
    const navigate = useNavigate();

    const handleOnOpenChange = (newState: boolean) => {
        // todo check if there are unsaved changes and ask for confirmation.
        editingOverlayContext.setShowingEditorOverlay(newState);
    };

    const handlePostSubmit = (new_id: string) => {
        console.log("Post sent! Trying to navigate...");
        navigate("/feed", { state: { new_id: new_id } });
    };

    return (
        <EditDialog
            open={editingOverlayContext.showingEditorOverlay()}
            onOpenChange={handleOnOpenChange}
            onSubmit={handlePostSubmit}
        ></EditDialog>
    );
};

export default EditOverlay;
