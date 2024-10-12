import generator, { detector, MegalodonInterface } from "megalodon";
import { Account } from "megalodon/lib/src/entities/account";
import { Instance } from "megalodon/lib/src/entities/instance";
import OAuth from "megalodon/lib/src/oauth";
import { createContext, useContext } from "solid-js";
import { SetStoreFunction } from "solid-js/store";
import { OAuthRegistration, PillbugAccount, PillbugSessionContext, SessionContext, SignedInAccount, useRawSessionContext } from "./session-context";
import { unwrapResponse } from "./clientUtil";

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
    signedIn: EphemeralMaybeSignedInState;
}

export type EphemeralMaybeSignedInState = EphemeralSignedInState | false | null;

export interface EphemeralSignedInState {
    authenticatedClient: MegalodonInterface;
    instanceData: Instance;
    accountData: Account;
    domain: string;
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
    return new SessionAuthManager(() => {
        return useRawSessionContext();
    });
}

export class SessionAuthManager {
    constructor(public readonly useContext: () => PillbugSessionContext) {

    }

    public checkAccountsExist(): boolean {
        const sessionContext = this.useContext();
        if (sessionContext.persistentStore.accounts === undefined) {
            return false;
        }

        if (sessionContext.persistentStore.accounts.length === 0) {
            return false;
        }

        // Fix up the last used account index while we're checking for signed in status
        let lastUsedAccount = sessionContext.persistentStore.lastUsedAccount;
        if (lastUsedAccount === undefined) {
            sessionContext.setPersistentStore("lastUsedAccount", 0);
        }
        else if (lastUsedAccount >= sessionContext.persistentStore.accounts.length) {
            sessionContext.setPersistentStore("lastUsedAccount", 0);
        }

        return true;
    }

    public async getAuthenticatedClientAsync(): Promise<MegalodonInterface> {
        const state = await this.getSignedInState();
        return state.authenticatedClient;
    }

    /** Get the current cached signed in state. Throws if there is no signed in account, or the client has not been created in this session yet. */
    public getCachedSignedInState(): EphemeralSignedInState {
        const sessionContext = this.useContext();

        let signedInState = sessionContext.sessionStore.signedIn;
        if (signedInState === undefined || signedInState === null) {
            // If this throws, getSignedInState() hasn't been called yet.
            throw new Error("Can't get cached signed in state, client must be created first.")
        }

        if (signedInState === false) {
            throw new Error("Not signed in (signed in state is false)")
        }

        return signedInState;
    }

    /** Get the current signed in state for this session. Throws if there is no signed in account. If the client was not created this session yet, it'll be created. */
    public async getSignedInState(): Promise<EphemeralSignedInState> {
        const sessionContext = this.useContext();

        let signedInState = sessionContext.sessionStore.signedIn;
        if (signedInState !== undefined && signedInState !== null && signedInState !== false) {
            return signedInState;
        }

        let currentAccountIndex = sessionContext.sessionStore.currentAccountIndex;
        if (currentAccountIndex === undefined) {
            sessionContext.setSessionStore("currentAccountIndex", sessionContext.persistentStore.lastUsedAccount ?? 0);
            currentAccountIndex = 0;
        }

        if (sessionContext.persistentStore.accounts === undefined) {
            throw new Error("Account list is undefined")
        }

        if (currentAccountIndex >= sessionContext.persistentStore.accounts.length) {
            throw new Error(`Out of bounds account index: ${currentAccountIndex} >= ${sessionContext.persistentStore.accounts.length}`)
        }

        const account: PillbugAccount = sessionContext.persistentStore.accounts[currentAccountIndex];
        if (!account.signedIn) {
            throw new Error("Account isn't signed in");
        }

        const client = await this.getClientForAccount(account);

        const instanceInfo = unwrapResponse(await client.getInstance(), "Getting instance info");
        const creds = unwrapResponse(await client.verifyAccountCredentials(), "Verifying account credentials");

        let domain = instanceInfo.uri;
        try {
            domain = new URL(instanceInfo.uri).hostname;
        } catch { }

        signedInState = {
            authenticatedClient: client,
            instanceData: instanceInfo,
            accountData: creds,
            domain: domain
        }

        sessionContext.setSessionStore("signedIn", signedInState)
        return signedInState;
    }

    public async getClientForAccount(account: SignedInAccount): Promise<MegalodonInterface> {
        account = await this.ensureAccountHasCurrentToken(account);

        const client = generator(account.instanceSoftware, account.instanceUrl, account.token.tokenData.access_token)
        return client;
    }

    private async ensureAccountHasCurrentToken(account: SignedInAccount): Promise<SignedInAccount> {
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

        const partialLogin = this.getUnfinishedLogin();

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

        return completeLogin;
    }

    private appendAccount(account: PillbugAccount) {
        const sessionContext = this.useContext();
        const length: number | undefined = sessionContext.persistentStore.accounts?.length;

        if (length === undefined) {
            sessionContext.setPersistentStore("accounts", [account]);
            sessionContext.setPersistentStore("lastUsedAccount", 0);
        } else {
            // This adds it to the end of the list in the store.
            sessionContext.setPersistentStore("accounts", length, account);
            sessionContext.setPersistentStore("lastUsedAccount", length);
        }
    }

    private getUnfinishedLogin(): PillbugAccount {
        const accounts = this.useContext().persistentStore.accounts;
        if (accounts === undefined) { throw new Error("Can't complete logging in, there are no accounts in the persistent store") }

        for (const account of accounts) {
            if (account.signedIn === false && account.redirectUri !== undefined) {
                return account;
            }
        }

        throw new Error("Can't complete logging in, there are no unfinished logins in the persistent store")
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