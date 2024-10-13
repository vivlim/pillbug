import { createContext, useContext } from "solid-js";
import { SessionAuthManager } from "../auth/auth-manager";
import { BlockingLoadProgressTracker } from "./blocking-load";
import { SettingsManager } from "./settings-manager";

export const SessionContext = createContext<PillbugSessionContext>();

/** Context containing stores relevant to the current session of Pillbug. Constructed in App.tsx. */
export interface PillbugSessionContext {
    authManager: SessionAuthManager;
    /** Global progress tracker for all async operations that must complete before we should try to load the frame. */
    blockingLoadProgressTracker: BlockingLoadProgressTracker;
    settingsManager: SettingsManager;
}

/** Directly access the session context. It is usually more convenient to use more specific helpers like useAuth and useSettings. */
export function useSessionContext(): PillbugSessionContext {
    const value = useContext(SessionContext);
    if (value === undefined) {
        throw new Error("useSessionContext() must be used within a provider");
    }
    return value;
}
