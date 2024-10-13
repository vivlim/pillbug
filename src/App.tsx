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
    AuthContext,
    AuthProviderProps,
    EphemeralAuthState,
    PersistentAuthState,
    TokenState,
    updateAuthStateForActiveAccount,
} from "./lib/auth-context";
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

export class GetClientError extends Error {}

export const AppDisplayName: string = "pillbug";

function tokenIsExpired(tokenState: TokenState): boolean {
    const nowUtc: number = new Date().getTime();
    if (
        tokenState.expiresAfterTime !== null &&
        nowUtc >= tokenState.expiresAfterTime
    ) {
        return true;
    }
    return false;
}

export async function tryGetAuthenticatedClient(
    authContext: AuthProviderProps
): Promise<MegalodonInterface | null> {
    throw new Error("not yet");
}

export function logOut(authContext: AuthProviderProps) {
    throw new Error("not yet");
    /*
    authContext.setPersistentAuthState("appData", undefined);
    authContext.setPersistentAuthState("authorizationCode", undefined);
    // authContext.setPersistentAuthState("instanceUrl", undefined); // this is inconvenient for dev
    authContext.setPersistentAuthState("instanceSoftware", undefined);
    authContext.setPersistentAuthState("token", undefined);
    authContext.setAuthState("signedIn", false);
    */
}

const App: Component<RouteSectionProps> = (props: RouteSectionProps) => {
    const [persistentStore, setPersistentStore] = makePersisted(
        createStore<PillbugPersistentStore>(
            {},
            { name: "pillbugPersistentStore" }
        )
    );
    const [sessionStore, setSessionStore] = createStore<PillbugSessionStore>({
        currentAccountIndex: persistentStore.lastUsedAccount ?? 0,
    });

    const [showingEditorOverlay, setShowingEditorOverlay] = createSignal(false);

    const [authState, setCurrentAccountIndex] = createResource(
        () => sessionStore.currentAccountIndex,
        async (i) =>
            updateAuthStateForActiveAccount(
                i,
                persistentStore,
                setPersistentStore
            )
    );

    const blockingLoadProgressTracker = new BlockingLoadProgressTracker(
        initialLoadOperations
    );
    blockingLoadProgressTracker.pushNewResourceOperation(
        "loading account state",
        "loadAccountState",
        authState
    );

    return (
        <SessionContext.Provider
            value={{
                sessionStore,
                setSessionStore,
                persistentStore,
                setPersistentStore,
                authState,
                blockingLoadProgressTracker,
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
