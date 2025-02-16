import { createSignal, type Component } from "solid-js";

import { RouteSectionProps } from "@solidjs/router";
import { SessionAuthManager } from "./auth/auth-manager";
import { EditingOverlayContext } from "./lib/edit-overlay-context";
import { PillbugSessionContext, SessionContext } from "./lib/session-context";
import {
    BlockingLoadProgressTracker,
    initialLoadOperations,
} from "./lib/blocking-load";
import { TrackedBlockingLoadComponent } from "./components/tracked-blocking-load";
import { SettingsManager } from "./lib/settings-manager";
import { lazy } from "solid-js";
import { FeedManager } from "./lib/feed-manager";
import { SeenAccountsStore } from "./lib/following-accounts-store";

const AppFrame = lazy(() => import("./components/frame/Frame"));

export class GetClientError extends Error {}

var staticSessionContext: PillbugSessionContext | undefined = undefined;

//** Expose session context statically so it's available in non-ui places (e.g. redux) */
export function StaticSessionContextWorkaround() {
    return staticSessionContext;
}

const App: Component<RouteSectionProps> = (props: RouteSectionProps) => {
    // This is where the session context gets constructed and built.
    const [showingEditorOverlay, setShowingEditorOverlay] = createSignal(false);

    const settingsManager = new SettingsManager();

    const authManager = new SessionAuthManager();

    const feedManager = new FeedManager();

    const seenAccountsStore = new SeenAccountsStore({});

    const blockingLoadProgressTracker = new BlockingLoadProgressTracker(
        initialLoadOperations
    );

    blockingLoadProgressTracker.pushNewResourceOperation(
        "loading account state",
        "loadAccountState",
        authManager.authState
    );

    staticSessionContext = {
        authManager,
        blockingLoadProgressTracker,
        settingsManager,
        feedManager,
        seenAccountsStore,
    };

    return (
        <SessionContext.Provider value={staticSessionContext}>
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
