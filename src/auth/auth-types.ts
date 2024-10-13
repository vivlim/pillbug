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
    authenticatedClient: MegalodonInterface;
    instanceData: Instance;
    accountData: Account;
    domain: string;
    signedIn: true;
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