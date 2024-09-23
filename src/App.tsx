import { createContext, useContext, type Component } from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";
import LandingView from "./views/landing";
import { createStore, SetStoreFunction } from "solid-js/store";
import { RouteProps, RouteSectionProps } from "@solidjs/router";
import OAuth from "megalodon/lib/src/oauth";
import { makePersisted } from "@solid-primitives/storage";
import generator, { MegalodonInterface } from "megalodon";
import AppFrame from "./Frame";

const AuthContext = createContext<AuthProviderProps>();

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
    signedIn: boolean | null;
    authenticatedClient: MegalodonInterface | null;
}

interface TokenState {
    tokenData: OAuth.TokenData;
    expiresAfterTime: number | null;
}

export class GetClientError extends Error {}

export const AppDisplayName: string = "pillbug";

interface AuthProviderProps {
    persistentAuthState: PersistentAuthState;
    setPersistentAuthState: SetStoreFunction<PersistentAuthState>;
    authState: EphemeralAuthState;
    setAuthState: SetStoreFunction<EphemeralAuthState>;
}

export function useAuthContext(): AuthProviderProps {
    const value = useContext(AuthContext);
    if (value === undefined) {
        throw new Error("useAuthContext must be used within a provider");
    }
    return value;
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

async function checkToken(
    authContext: AuthProviderProps,
    tryRefresh: boolean
): Promise<boolean> {
    let tokenState = authContext.persistentAuthState.token;

    if (tokenState === undefined) {
        console.log("There is no token state currently");
        return false;
    }

    if (tokenIsExpired(tokenState)) {
        // Expired.
        console.log("Token is expired.");
        if (tryRefresh) {
            if (tokenState.tokenData.refresh_token === null) {
                console.log("Token expired and we don't have a refresh token.");
                return false;
            }

            try {
                await tryGetToken(authContext);
            } catch (error) {
                if (error instanceof Error) {
                    console.log(
                        `Failed to get token using refresh token: ${error.message}`
                    );
                    return false;
                }
            }

            return await checkToken(authContext, false);
        } else {
            return false;
        }
    }

    return true;
}

export async function tryGetAuthenticatedClient(
    authContext: AuthProviderProps
): Promise<MegalodonInterface | null> {
    let authState = authContext.persistentAuthState;

    if (
        authState.instanceSoftware === undefined ||
        authState.instanceUrl === undefined ||
        authState.token === undefined
    ) {
        console.log(
            "Can't get an authenticated client, auth state isn't initialized"
        );
        return null;
    }

    try {
        let token = await tryGetToken(authContext);

        let client = generator(
            authState.instanceSoftware,
            authState.instanceUrl,
            authState.token.tokenData.access_token,
            AppDisplayName
        );
        return client;
    } catch (error) {
        if (error instanceof Error) {
            console.log(`Failed to get authenticated client. ${error.message}`);
        }
        return null;
    }
}

export function tryGetUnauthenticatedClient(
    authContext: AuthProviderProps
): MegalodonInterface {
    let authState = authContext.persistentAuthState;

    if (
        authState.instanceSoftware === undefined ||
        authState.instanceUrl === undefined
    ) {
        throw new GetClientError(
            "Instance software and/or url were not defined in auth state."
        );
    }
    let client = generator(authState.instanceSoftware, authState.instanceUrl);
    return client;
}

/// Try to get an access token. Throws if there are problems.
/// If we have one which isn't expired, that will be used.
/// If it is expired, and we have a refresh token, we'll try to use that.
/// If there is no token then try to get one.
export async function tryGetToken(
    authContext: AuthProviderProps
): Promise<OAuth.TokenData> {
    let authState = authContext.persistentAuthState;
    let client = tryGetUnauthenticatedClient(authContext);

    let tokenDataPromise: Promise<OAuth.TokenData> | null = null;

    const nowUtc: number = new Date().getTime();

    // Do we have a token now? Maybe we can use it.
    if (authState.token !== undefined) {
        console.log("there is currently a token");
        if (tokenIsExpired(authState.token)) {
            if (authState.token.tokenData.refresh_token === null) {
                throw new GetClientError(
                    "Token is expired and we have no refresh token."
                );
            }

            if (
                authState.appData === undefined ||
                authState.appData?.client_id === undefined ||
                authState.appData.client_secret === undefined
            ) {
                throw new GetClientError(
                    `Missing client id / secret, cannot use refresh token.`
                );
            }

            // It's expired and we have a refresh token, let's use it.
            tokenDataPromise = client.refreshToken(
                authState.appData.client_id,
                authState.appData.client_secret,
                authState.token.tokenData.refresh_token
            );
        } else {
            // token is not expired.
            return authState.token.tokenData;
        }
    } else {
        // We don't have a token, so let's try to get one.
        console.log("there is currently no token");

        if (
            authState.appData === undefined ||
            authState.appData.redirect_uri === null
        ) {
            // this shouldn't happen, tryGetClient() should throw instead
            throw new GetClientError(
                "App registration data isn't set, which is unexpected"
            );
        }
        if (authState.authorizationCode === undefined) {
            throw new GetClientError(
                "Authorization code isn't set, can't get a token"
            );
        }
        tokenDataPromise = client.fetchAccessToken(
            authState.appData.client_id,
            authState.appData.client_secret,
            authState.authorizationCode,
            authState.appData.redirect_uri
        );
    }

    let accessToken = await tokenDataPromise;

    if (accessToken.expires_in === null) {
        authContext.setPersistentAuthState("token", {
            tokenData: accessToken,
            expiresAfterTime: null,
        });
    } else {
        authContext.setPersistentAuthState("token", {
            tokenData: accessToken,
            expiresAfterTime: nowUtc + accessToken.expires_in,
        });
    }

    return accessToken;
}

const App: Component<RouteSectionProps> = (props: RouteSectionProps) => {
    const [persistentAuthState, setPersistentAuthState] = makePersisted(
        createStore<PersistentAuthState>({
            appData: undefined,
            instanceUrl: undefined,
        })
    );
    const [authState, setAuthState] = createStore<EphemeralAuthState>({
        signedIn: null,
        authenticatedClient: null,
    });
    return (
        <AuthContext.Provider
            value={{
                persistentAuthState: persistentAuthState,
                setPersistentAuthState: setPersistentAuthState,
                authState: authState,
                setAuthState: setAuthState,
            }}
        >
            <AppFrame>{props.children}</AppFrame>
        </AuthContext.Provider>
    );
};

export default App;
