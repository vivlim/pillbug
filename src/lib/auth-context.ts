import generator, { detector, MegalodonInterface } from "megalodon";
import { Account } from "megalodon/lib/src/entities/account";
import { Instance } from "megalodon/lib/src/entities/instance";
import OAuth from "megalodon/lib/src/oauth";
import { createContext, createMemo, createResource, Resource, useContext } from "solid-js";
import { produce, SetStoreFunction } from "solid-js/store";
import { OAuthRegistration, PillbugAccount, PillbugPersistentStore, PillbugSessionContext, PillbugSessionStore, SessionContext, SignedInAccount, useRawSessionContext } from "./session-context";
import { unwrapResponse } from "./clientUtil";
import { PersistentStoreBacked } from "./store-backed";

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

export interface EphemeralAuthState {
    signedIn: EphemeralMaybeSignedInState; // TODO rename this
}

export type EphemeralMaybeSignedInState = EphemeralSignedInState | NotSignedInState | null;

export interface EphemeralSignedInState {
    authenticatedClient: MegalodonInterface;
    instanceData: Instance;
    accountData: Account;
    domain: string;
    signedIn: true;
}

export interface NotSignedInState {
    signedIn: false;
}

export interface TokenState {
    tokenData: OAuth.TokenData;
    expiresAfterTime: number | null;
}

export const AuthContext = createContext<AuthProviderProps>();
export interface AuthProviderProps {
    // persistentAuthState: PersistentAuthState;
    // setPersistentAuthState: SetStoreFunction<PersistentAuthState>;
    authState: EphemeralAuthState;
    // setAuthState: SetStoreFunction<EphemeralAuthState>;
}

/** Compatibility shim for code using pre-refactor auth. */
export function useAuthContext(): AuthProviderProps {
    const manager = useSessionAuthManager();
    const signedInState = manager.getCachedSignedInState();

    return {
        authState: { signedIn: signedInState }
    }

}

const AppDisplayName: string = "pillbug";

export function useSessionAuthManager(): SessionAuthManager {
    const sessionContext = useRawSessionContext();
    return sessionContext.authManager;
}


export class SessionAuthManager extends PersistentStoreBacked<PillbugSessionStore, PillbugPersistentStore> {
    /** State related to the current account, like an authenticated client if available */
    public readonly authState: Resource<EphemeralMaybeSignedInState>;

    constructor() {
        const initialEphemeral: PillbugSessionStore = {
            currentAccountIndex: undefined,
        };
        const initialPersistent: PillbugPersistentStore = {
        }
        super(initialEphemeral, initialPersistent, {
            name: "pillbug-authManager"
        });

        const [authState] = createResource(
            () => this.store.currentAccountIndex,
            async (i) =>
                updateAuthStateForActiveAccount(
                    i,
                    this.persistentStore,
                    this.setPersistentStore
                )
        );

        this.authState = authState;

        // Now that everything's set up, change the account index if there is an account
        if (this.persistentStore.accounts !== undefined && this.persistentStore.accounts.length > 0) {
            this.setStore("currentAccountIndex", this.persistentStore.lastUsedAccount ?? 0);
        }
    }

    public checkAccountsExist(): boolean {
        if (this.persistentStore.accounts === undefined) {
            return false;
        }

        if (this.persistentStore.accounts.length === 0) {
            return false;
        }

        // Fix up the last used account index while we're checking for signed in status
        let lastUsedAccount = this.persistentStore.lastUsedAccount;
        if (lastUsedAccount === undefined) {
            this.setPersistentStore("lastUsedAccount", 0);
        }
        else if (lastUsedAccount >= this.persistentStore.accounts.length) {
            this.setPersistentStore("lastUsedAccount", 0);
        }

        return true;
    }

    public checkSignedIn(): boolean {
        if (!this.checkAccountsExist()) {
            return false;
        }

        if (!this.authState()?.signedIn) {
            return false;
        }

        return true;
    }

    public getAuthenticatedClientAsync(): MegalodonInterface | undefined {
        const state = this.getSignedInState();
        if (!state?.signedIn) {
            return undefined;
        }
        return state.authenticatedClient;
    }

    /** Get the current cached signed in state. Throws if there is no signed in account, or the client has not been created in this session yet. */
    public getCachedSignedInState(): EphemeralMaybeSignedInState {
        return this.authState() ?? { signedIn: false };
    }

    public getActiveAccountIndex(): number {
        return this.store.currentAccountIndex ?? -1
    }

    /** Get the current signed in state for this session. Throws if there is no signed in account. If the client was not created this session yet, it'll be created. */
    public getSignedInState(): EphemeralMaybeSignedInState {
        return this.authState() ?? { signedIn: false }
    }

    public getAccountList(): SignedInAccount[] {
        if (this.persistentStore.accounts === undefined) {
            return [];
        }

        return this.persistentStore.accounts.filter(a => a.signedIn);
    }

    public switchActiveAccount(newIdx: number): void {
        this.setStore("currentAccountIndex", newIdx);
        // ??? idk what this line was this.context.authState()
        this.setPersistentStore("lastUsedAccount", newIdx);
    }


    public async createNewInstanceRegistration(instance: string): Promise<OAuthRegistration> {

        // Normalize Instance URL.
        // Check for https:// or http:// at the beginning of the instance string, and add it if it's not there (assume https)
        if (
            !instance.startsWith("https://") &&
            !instance.startsWith("http://")
        ) {
            instance = `https://${instance}`;
        }
        // Trim trailing forward slashes.
        instance = instance.replace(/\/+$/, "");
        // TODO: Additional normalization? I'm not sure what other ways a URL can be malformed.
        let software = await detector(instance);
        console.log(`detected software '${software}' on ${instance}`);

        // Create the unauthenticated client.
        let client = generator(software, instance);

        let redirect_uri = window.location.href;
        if (window.location.search.length > 0) {
            redirect_uri = redirect_uri.substring(
                0,
                redirect_uri.length - window.location.search.length
            );
        }
        console.log(`redirect uri: ${redirect_uri}`);

        let appData = await client.registerApp(AppDisplayName, {
            redirect_uris: redirect_uri, // code will be passed as get parameter 'code'
        });
        if (appData === undefined || appData.url === null) {
            throw new Error("Failed to register oauth app");
        }

        const newRegistration: OAuthRegistration = {
            appData,
            instanceUrl: instance,
            instanceSoftware: software,
            signedIn: false,
            redirectUri: redirect_uri,
        }

        this.appendAccount(newRegistration);
        return newRegistration;
    }

    public async completeLogin(code: string) {
        console.log("Attempting to complete login");

        try {
            const [partialLogin, partialLoginIndex] = this.getUnfinishedLogin();

            // obtain our first token.
            let client = generator(partialLogin.instanceSoftware, partialLogin.instanceUrl);

            if (partialLogin.appData.redirect_uri === null) {
                throw new Error("Failed to complete login: redirect_uri was null")
            }

            let token = await client.fetchAccessToken(partialLogin.appData.client_id,
                partialLogin.appData.client_secret,
                code,
                partialLogin.appData.redirect_uri
            )

            const tokenState: TokenState = wrapToken(token);

            const completeLogin: SignedInAccount = {
                appData: partialLogin.appData,
                instanceUrl: partialLogin.instanceUrl,
                instanceSoftware: partialLogin.instanceSoftware,
                signedIn: true,
                token: tokenState,
            };
            console.log(`Attempting to write back to persistent store a complete login for ${completeLogin.instanceUrl}`)

            this.setPersistentStore("accounts", partialLoginIndex, (prev) => {
                if (prev.appData.client_id !== completeLogin.appData.client_id) {
                    throw new Error("Mismatch when trying to overwrite the partially signed in account with the complete one.");
                }
                return completeLogin;
            });

            console.log(`Completed login to ${completeLogin.instanceUrl}`)

            return completeLogin;
        }
        catch (e) {
            if (e instanceof Error) {
                console.error(`Failed to complete login: ${e}`)
                throw e;
            }
        }
    }

    private appendAccount(account: PillbugAccount) {
        const length: number | undefined = this.persistentStore.accounts?.length;

        if (length === undefined) {
            this.setPersistentStore("accounts", [account]);
            this.setPersistentStore("lastUsedAccount", 0);
        } else {
            // This adds it to the end of the list in the store.
            this.setPersistentStore("accounts", length, account);
            this.setPersistentStore("lastUsedAccount", length);
        }
    }

    private getUnfinishedLogin(): [PillbugAccount, number] {
        const accounts = this.persistentStore.accounts?.slice();
        if (accounts === undefined) { throw new Error("Can't complete logging in, there are no accounts in the persistent store") }

        let unfinishedLogins: number[] = [];

        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            if (account.signedIn === false && account.redirectUri !== undefined) {
                unfinishedLogins.push(i);
            }
        }

        if (unfinishedLogins.length === 0) {
            throw new Error("Can't complete logging in, there are no unfinished logins in the persistent store")
        }

        let unfinishedLoginIndexToUse = unfinishedLogins.pop()!;
        const unfinishedLoginToUse = accounts[unfinishedLoginIndexToUse];

        if (unfinishedLogins.length > 0) {
            unfinishedLogins.reverse();
            console.log(`Cleaning up ${unfinishedLogins.length} old unfinished logins and using the most recent one.`)

            for (const i of unfinishedLogins) {
                accounts.splice(i, 1);
            }

            // Update what the index is.
            unfinishedLoginIndexToUse = accounts.indexOf(unfinishedLoginToUse)
        }

        // Need to set these both at the same time. If they get out of sync, weird stuff
        console.log(`Account index: ${unfinishedLoginIndexToUse}. Accounts: ${JSON.stringify(accounts)}`)
        this.setPersistentStore(produce((store) => {
            store.lastUsedAccount = unfinishedLoginIndexToUse;
            store.accounts = accounts;
        }))

        return [unfinishedLoginToUse, unfinishedLoginIndexToUse];
    }
}


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

function wrapToken(token: OAuth.TokenData): TokenState {
    const nowUtc: number = new Date().getTime();
    const tokenState: TokenState = {
        tokenData: token,
        expiresAfterTime: null,
    }
    if (token.expires_in !== null) {
        // Not sure this is actually necessary to compute.
        tokenState.expiresAfterTime = nowUtc + token.expires_in
    }
    return tokenState;
}

export async function updateAuthStateForActiveAccount(accountIndex: number, persistentStore: PillbugPersistentStore, setPersistentStore: SetStoreFunction<PillbugPersistentStore>): Promise<EphemeralMaybeSignedInState> {
    // not sure if i need to use store fns passed in or i can use the ones belonging to this class. it is called from a resource context.

    if (persistentStore.accounts === undefined || persistentStore.accounts.length === 0) {
        return { signedIn: false };
    }

    if (accountIndex >= persistentStore.accounts.length) {
        const clamped = persistentStore.accounts.length - 1;
        console.log(`Out of bounds account index: ${accountIndex} >= ${persistentStore.accounts.length}. clamping to ${clamped}`);
        accountIndex = clamped;
    }

    let account: PillbugAccount = persistentStore.accounts[accountIndex];

    if (!account.signedIn) {
        return { signedIn: false };
    }

    account = await ensureAccountHasCurrentToken(account);
    const client = generator(account.instanceSoftware, account.instanceUrl, account.token.tokenData.access_token)

    const instanceInfo = unwrapResponse(await client.getInstance(), "Getting instance info");
    const creds = unwrapResponse(await client.verifyAccountCredentials(), "Verifying account credentials");

    let domain = instanceInfo.uri;
    try {
        domain = new URL(instanceInfo.uri).hostname;
    } catch { }

    return {
        authenticatedClient: client,
        instanceData: instanceInfo,
        accountData: creds,
        domain: domain,
        signedIn: true,
    }

}

async function ensureAccountHasCurrentToken(account: SignedInAccount): Promise<SignedInAccount> {
    const currentTokenState = account.token;
    if (tokenIsExpired(currentTokenState)) {
        // I don't know if the refresh code actually works. It hasn't been tested.

        if (currentTokenState.tokenData.refresh_token === null) {
            throw new Error(
                "Token is expired and we have no refresh token."
            )
        }

        // Create an unauthenticated client.
        let client = generator(account.instanceSoftware, account.instanceUrl);
        const newToken = await client.refreshToken(account.appData.client_id, account.appData.client_secret, account.token.tokenData.refresh_token!);

        const tokenState: TokenState = wrapToken(newToken);

        return {
            appData: account.appData,
            instanceUrl: account.instanceUrl,
            instanceSoftware: account.instanceSoftware,
            signedIn: true,
            token: tokenState,
        }
    }

    return account;
}