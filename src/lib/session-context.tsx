import { Accessor, createContext, Resource, useContext } from "solid-js";
import { EphemeralMaybeSignedInState, TokenState } from "./auth-context";
import { SetStoreFunction } from "solid-js/store";
import { OAuth } from "megalodon";

export const SessionContext = createContext<PillbugSessionContext>();

/** Context containing stores relevant to the current session of Pillbug. */
export interface PillbugSessionContext {
    sessionStore: PillbugSessionStore;
    setSessionStore: SetStoreFunction<PillbugSessionStore>;
    authState: Resource<EphemeralMaybeSignedInState>;

    persistentStore: PillbugPersistentStore;
    setPersistentStore: SetStoreFunction<PillbugPersistentStore>;
}

export function useSessionContext(): WrappedSessionContext {
    return new WrappedSessionContext(() => {
        return useRawSessionContext();
    });
}

export function useRawSessionContext(): PillbugSessionContext {
    const value = useContext(SessionContext);
    if (value === undefined) {
        throw new Error("useSessionContext() must be used within a provider");
    }
    return value;
}

export class WrappedSessionContext {
    constructor(public readonly useContext: () => PillbugSessionContext) {}
}

/** 'Live' data store related to the current pillbug tab / instance. */
export interface PillbugSessionStore {
    currentAccountIndex: number | undefined;
}

/** Persistent data store shared across all sessions of Pillbug. */
export interface PillbugPersistentStore {
    accounts?: PillbugAccount[] | undefined;
    lastUsedAccount?: number | undefined;
}

export type PillbugAccount = OAuthRegistration | SignedInAccount;

export interface AccountBase {
    appData: OAuth.AppData;
    instanceUrl: string;
    instanceSoftware:
        | "mastodon"
        | "pleroma"
        | "friendica"
        | "firefish"
        | "gotosocial";
}
export interface OAuthRegistration extends AccountBase {
    signedIn: false;
    redirectUri: string;
}

export interface SignedInAccount extends AccountBase {
    signedIn: true;
    token: TokenState;
}
