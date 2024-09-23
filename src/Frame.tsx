import {
    createContext,
    createSignal,
    JSX,
    useContext,
    type Component,
} from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";
import HomeView from "./views/home";
import { createStore, SetStoreFunction } from "solid-js/store";
import { RouteProps, RouteSectionProps, useNavigate } from "@solidjs/router";
import OAuth from "megalodon/lib/src/oauth";
import { makePersisted } from "@solid-primitives/storage";
import generator, { MegalodonInterface } from "megalodon";
import {
    AuthProviderProps,
    logOut,
    tryGetAuthenticatedClient,
    useAuthContext,
} from "./App";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarTrigger,
} from "./components/ui/menubar";
import { Button } from "./components/ui/button";

export const initAppFrameAsync = async (authContext: AuthProviderProps) => {
    try {
        const client = await tryGetAuthenticatedClient(authContext);
        if (client !== null) {
            authContext.setAuthState("authenticatedClient", client);
            authContext.setAuthState("signedIn", true);
        } else {
            authContext.setAuthState("signedIn", false);
        }
    } catch (error) {
        if (error instanceof Error) {
            alert(`Error loading page: ${error.message}`);
        }
    }
};

const AppFrame: Component<{ children: JSX.Element }> = (props) => {
    const authContext = useAuthContext();
    const [busy, setBusy] = createSignal(true);

    const init = async () => {
        const authContext = useAuthContext();
        await initAppFrameAsync(authContext);
        setBusy(false);
    };

    init();

    const navigate = useNavigate();

    return (
        <div class="bg-white dark:bg-slate-800">
            <div class="sticky top-0 z-40 w-full backdrop-blur flex-none">
                <div class="max-w-8xl mx-auto">
                    <div class="py-4 border-b border-slate-900/10 lg:px-8 lg:border-0 dark:border-slate-300/10 mx-4 lg:mx-0 flex flex-row">
                        <div class="grow">
                            <div
                                class="cursor-pointer"
                                onClick={() => navigate("/")}
                            >
                                pillbug
                            </div>
                        </div>
                        {authContext.authState.signedIn && (
                            <Menubar>
                                <MenubarMenu>
                                    <MenubarTrigger>Account</MenubarTrigger>
                                    <MenubarContent>
                                        {authContext.authState.signedIn && (
                                            <MenubarItem
                                                onClick={() => {
                                                    logOut(authContext);
                                                    navigate("/");
                                                }}
                                            >
                                                Log out
                                            </MenubarItem>
                                        )}
                                    </MenubarContent>
                                </MenubarMenu>
                            </Menubar>
                        )}
                        {!authContext.authState.signedIn && (
                            <Button
                                onClick={() =>
                                    navigate("/login", {
                                        replace: true,
                                    })
                                }
                            >
                                Log in
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            {busy() && (
                <div>
                    <span class="animate-spin">🤔</span>
                </div>
            )}
            {!busy() && props.children}
        </div>
    );
};

export default AppFrame;
