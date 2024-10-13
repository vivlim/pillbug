import { Accessor, createContext, useContext } from "solid-js";
import {
    MaybeSignedInState,
    SessionAuthManager,
    TokenState,
} from "../auth/auth-manager";
import { OAuth } from "megalodon";
import { BlockingLoadProgressTracker } from "./blocking-load";
import { Account } from "megalodon/lib/src/entities/account";
import { Instance } from "megalodon/lib/src/entities/instance";
import { SettingsManager } from "./settings-manager";

export const SessionContext = createContext<PillbugSessionContext>();

/** Context containing stores relevant to the current session of Pillbug. */
export interface PillbugSessionContext {
    authManager: SessionAuthManager;
    blockingLoadProgressTracker: BlockingLoadProgressTracker;
    settingsManager: SettingsManager;
}

export function useSessionContext(): PillbugSessionContext {
    const value = useContext(SessionContext);
    if (value === undefined) {
        throw new Error("useSessionContext() must be used within a provider");
    }
    return value;
}

export class WrappedSessionContext {
    constructor(public readonly useContext: () => PillbugSessionContext) {}
}
