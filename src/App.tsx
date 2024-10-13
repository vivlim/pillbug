import {
    Accessor,
    createContext,
    createMemo,
    createResource,
    createSignal,
    Setter,
    useContext,
    type Component,
} from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";
import HomeView from "./views/home";
import { createStore, SetStoreFunction } from "solid-js/store";
import { RouteProps, RouteSectionProps, useNavigate } from "@solidjs/router";
import OAuth from "megalodon/lib/src/oauth";
import { makePersisted } from "@solid-primitives/storage";
import generator, { MegalodonInterface } from "megalodon";
import AppFrame from "./Frame";
import { Instance } from "megalodon/lib/src/entities/instance";
import { Account } from "megalodon/lib/src/entities/account";
import {
    EphemeralAuthState,
    PersistentAuthState,
    SessionAuthManager,
    TokenState,
    updateAuthStateForActiveAccount,
} from "./lib/auth-manager";
import { EditingOverlayContext } from "./lib/edit-overlay-context";
import {
    PillbugPersistentStore,
    PillbugSessionStore,
    SessionContext,
} from "./lib/session-context";
import {
    BlockingLoadProgressTracker,
    initialLoadOperations,
} from "./lib/blocking-load";
import { TrackedBlockingLoadComponent } from "./components/tracked-blocking-load";
import { SettingsManager } from "./lib/settings-manager";

export class GetClientError extends Error {}

const App: Component<RouteSectionProps> = (props: RouteSectionProps) => {
    // This is where the session context gets constructed and built.
    const [showingEditorOverlay, setShowingEditorOverlay] = createSignal(false);

    const settingsManager = new SettingsManager();

    const authManager = new SessionAuthManager();

    const blockingLoadProgressTracker = new BlockingLoadProgressTracker(
        initialLoadOperations
    );

    blockingLoadProgressTracker.pushNewResourceOperation(
        "loading account state",
        "loadAccountState",
        authManager.authState
    );

    return (
        <SessionContext.Provider
            value={{
                authManager,
                blockingLoadProgressTracker,
                settingsManager,
            }}
        >
            <TrackedBlockingLoadComponent
                tracker={blockingLoadProgressTracker}
                loadingCardClass="m-8"
            >
                <EditingOverlayContext.Provider
                    value={{
                        showingEditorOverlay: showingEditorOverlay,
                        setShowingEditorOverlay: setShowingEditorOverlay,
                    }}
                >
                    <AppFrame>{props.children}</AppFrame>
                </EditingOverlayContext.Provider>
            </TrackedBlockingLoadComponent>
        </SessionContext.Provider>
    );
};

export default App;
