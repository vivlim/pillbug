import { createContext, useContext, type Component } from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";
import LandingView from "./views/landing";
import { createStore, SetStoreFunction } from "solid-js/store";
import { RouteProps, RouteSectionProps } from "@solidjs/router";
import OAuth from "megalodon/lib/src/oauth";
import { makePersisted } from "@solid-primitives/storage";

const AuthContext = createContext<AuthProviderProps>();

export interface AuthState {
    appData: OAuth.AppData | undefined;
    instanceUrl: string | undefined;
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
    const [authState, setAuthState] = makePersisted(
        createStore<AuthState>({
            appData: undefined,
            instanceUrl: undefined,
        })
    );
    return (
        <AuthContext.Provider value={{ authState, setAuthState }}>
            <div class="bg-white dark:bg-slate-800">
                <div class="sticky top-0 z-40 w-full backdrop-blur flex-none">
                    <div class="max-w-8xl mx-auto">
                        <div class="py-4 border-b border-slade-900/10 lg:px-8 lg:border-0 dark:border-slate-300/10 mx-4 lg:mx-0">
                            pillbug
                        </div>
                    </div>
                </div>
                {props.children}
            </div>
        </AuthContext.Provider>
    );
};

export default App;
