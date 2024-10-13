import {
    Accessor,
    createContext,
    createSignal,
    Resource,
    useContext,
} from "solid-js";
import {
    EphemeralMaybeSignedInState,
    SessionAuthManager,
    TokenState,
} from "./auth-context";
import { SetStoreFunction } from "solid-js/store";
import { OAuth } from "megalodon";
import { BlockingLoadProgressTracker } from "./blocking-load";
import { Account } from "megalodon/lib/src/entities/account";
import { Instance } from "megalodon/lib/src/entities/instance";

export const SessionContext = createContext<PillbugSessionContext>();

/** Context containing stores relevant to the current session of Pillbug. */
export interface PillbugSessionContext {
    authManager: SessionAuthManager;
    blockingLoadProgressTracker: BlockingLoadProgressTracker;
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
    /** full acct (including username and domain). if it starts with a ?, an authenticated client hasn't been created yet. */
    fullAcct: string;
    cachedAccount: Account | undefined;
    cachedInstance: Instance | undefined;
}
