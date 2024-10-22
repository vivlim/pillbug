import { Accessor, createContext, Setter, useContext } from "solid-js";

export const EditingOverlayContext = createContext<EditingOverlayProps>();

export interface EditingOverlayProps {
    showingEditorOverlay: Accessor<boolean>;
    setShowingEditorOverlay: Setter<boolean>;
}

export function useEditOverlayContext(): EditingOverlayProps {
    const value = useContext(EditingOverlayContext);
    if (value === undefined) {
        throw new Error("useEditOverlayContext must be used within a provider (a new version of pillbug may have been deployed; try refreshing)");
    }
    return value;
}
