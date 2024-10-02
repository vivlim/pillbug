import { MegalodonInterface } from "megalodon";
import { Account } from "megalodon/lib/src/entities/account";
import { Instance } from "megalodon/lib/src/entities/instance";
import OAuth from "megalodon/lib/src/oauth";
import { createContext, useContext } from "solid-js";
import { SetStoreFunction } from "solid-js/store";

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
    signedIn:
    | {
        authenticatedClient: MegalodonInterface;
        instanceData: Instance;
        accountData: Account;
        domain: string;
    }
    | false
    | null;
}

export interface TokenState {
    tokenData: OAuth.TokenData;
    expiresAfterTime: number | null;
}

export const AuthContext = createContext<AuthProviderProps>();
export interface AuthProviderProps {
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