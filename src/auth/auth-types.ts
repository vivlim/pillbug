import { MegalodonInterface } from "megalodon";
import { Account } from "megalodon/lib/src/entities/account";
import { Instance } from "megalodon/lib/src/entities/instance";
import OAuth from "megalodon/lib/src/oauth";

export interface PersistentAuthState {
    appData?: OAuth.AppData | undefined;
    instanceUrl?: string | undefined;
    instanceSoftware?:
    | "mastodon"
    | "pleroma"
    | "friendica"
    | "firefish"
    | "gotosocial"
    | undefined;
    authorizationCode?: string | undefined;
    token?: TokenState | undefined;
}

export type MaybeSignedInState = SignedInState | SignedOutState | null;

export interface SignedInState {
    /** Client which may detour requests to redux cache */
    authenticatedClient: MegalodonInterface;
    /** Client which will always directly make requests, bypassing the redux cache */
    directClient: MegalodonInterface;
    instanceData: Instance;
    accountData: Account;
    domain: string;
    signedIn: true;
    software:
    | "mastodon"
    | "pleroma"
    | "friendica"
    | "firefish"
    | "gotosocial"
    | undefined;
    accountIndex: number;
    clientId: string;
}

export interface SignedOutState {
    signedIn: false;
}

export interface TokenState {
    tokenData: OAuth.TokenData;
    expiresAfterTime: number | null;
}

/** 'Live' data store related to the current pillbug tab / instance. */
export interface PillbugSessionStore {
    currentAccountIndex: number | undefined;
    accountIsSwitching: boolean;
}

/** Persistent data store shared across all sessions of Pillbug. */
export interface PillbugPersistentStore {
    accounts?: PillbugAccount[] | undefined;
    lastUsedAccount?: number | undefined;
    /** Stores 'last checked' ISO-format timestamps for miscellaneous functionality. Should really be stored elsewhere, this is a stopgap solution */
    lastChecked?: Record<string, string> | undefined;
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
    lastKnownNotificationId?: string;
    unreadNotifications?: boolean;
}