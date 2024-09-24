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
    useEditOverlayContext,
} from "./App";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarTrigger,
} from "./components/ui/menubar";
import { Button } from "./components/ui/button";
import EditOverlay from "./views/editoverlay";

export const initAppFrameAsync = async (authContext: AuthProviderProps) => {
    try {
        const client = await tryGetAuthenticatedClient(authContext);
        if (client !== null) {
            const instanceInfo = await client.getInstance();
            if (instanceInfo.status !== 200) {
                throw new Error(
                    `Failed to get instance info: ${instanceInfo.statusText}`
                );
            }
            const creds = await client.verifyAccountCredentials();
            if (creds.status !== 200) {
                throw new Error(
                    `Failed to get current user info: ${creds.statusText}`
                );
            }
            const domain = new URL(instanceInfo.data.uri).hostname;
            authContext.setAuthState("signedIn", {
                authenticatedClient: client,
                instanceData: instanceInfo.data,
                accountData: creds.data,
                domain: domain,
            });
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
    const editingOverlayContext = useEditOverlayContext();
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
            <EditOverlay></EditOverlay>
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
                        {authContext.authState.signedIn !== null &&
                            authContext.authState.signedIn !== false && (
                                <>
                                    <Menubar>
                                        <MenubarMenu>
                                            <MenubarTrigger>
                                                {`${authContext.authState.signedIn.accountData.username}@${authContext.authState.signedIn.domain}`}
                                            </MenubarTrigger>
                                            <MenubarContent>
                                                {authContext.authState
                                                    .signedIn && (
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

                                    <Button
                                        onClick={() =>
                                            editingOverlayContext.setShowingEditorOverlay(
                                                true
                                            )
                                        }
                                    >
                                        Post
                                    </Button>
                                </>
                            )}
                        {authContext.authState.signedIn === false && (
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
