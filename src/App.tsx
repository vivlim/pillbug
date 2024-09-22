import { createContext, useContext, type Component } from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";
import LandingView from "./views/landing";
import { createStore, SetStoreFunction } from "solid-js/store";
import { RouteProps, RouteSectionProps } from "@solidjs/router";
import OAuth from "megalodon/lib/src/oauth";

const AuthContext = createContext<AuthProviderProps>();

export interface AuthState {
    appData: OAuth.AppData | undefined;
}

interface AuthProviderProps {
    authState: AuthState;
    setAuthState: SetStoreFunction<AuthState>;
}

export function useAuthContext(): AuthProviderProps {
    const value = useContext(AuthContext);
    if (value === undefined) {
        throw new Error("useAuthContext must be used within a provider");
    }
    return value;
}

const App: Component<RouteSectionProps> = (props: RouteSectionProps) => {
    const [authState, setAuthState] = createStore<AuthState>({
        appData: undefined,
    });
    return (
        <AuthContext.Provider value={{ authState, setAuthState }}>
            <h1>header</h1>
            {props.children}
        </AuthContext.Provider>
    );
};

export default App;
