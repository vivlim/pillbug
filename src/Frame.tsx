import {
    Accessor,
    createContext,
    createResource,
    createSignal,
    JSX,
    Match,
    Setter,
    Show,
    Signal,
    Switch,
    useContext,
    type Component,
} from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";
import { useNavigate } from "@solidjs/router";
import { logOut, tryGetAuthenticatedClient } from "./App";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarTrigger,
} from "./components/ui/menubar";
import { Button } from "./components/ui/button";
import EditOverlay from "./views/editoverlay";
import {
    AuthProviderProps,
    EphemeralAuthState,
    EphemeralSignedInState,
    SessionAuthManager,
    useAuthContext,
    useSessionAuthManager,
} from "./lib/auth-context";
import { useEditOverlayContext } from "./lib/edit-overlay-context";
import { FaSolidBars } from "solid-icons/fa";
import { AvatarImage } from "./components/user/avatar";
import { Dynamic } from "solid-js/web";
import { Instance } from "megalodon/lib/src/entities/instance";
import {
    InstanceBanner,
    UserInstanceBanner,
} from "./components/instance-banner";

export const ExpandMenuSignalContext = createContext<{
    menuOpen: Accessor<boolean>;
    setMenuOpen: Setter<boolean>;
}>();

export function useExpandMenuSignalContext(): {
    menuOpen: Accessor<boolean>;
    setMenuOpen: Setter<boolean>;
} {
    const value = useContext(ExpandMenuSignalContext);
    if (value === undefined) {
        throw new Error(
            "useExpandMenuSignalContext must be used within a provider"
        );
    }
    return value;
}

const AppFrame: Component<{ children: JSX.Element }> = (props) => {
    const authManager = useSessionAuthManager();
    const editingOverlayContext = useEditOverlayContext();
    const [authState] = createResource(authManager, async (authManager) => {
        try {
            if (authManager.checkAccountsExist()) {
                return await authManager.getSignedInState();
            }

            return false;
        } catch (error) {
            if (error instanceof Error) {
                alert(`Error loading page: ${error.message}`);
            }
        }
    });

    const [expandMenu, setExpandMenu] = createSignal(false);

    const navigate = useNavigate();

    return (
        <ExpandMenuSignalContext.Provider
            value={{ menuOpen: expandMenu, setMenuOpen: setExpandMenu }}
        >
            <div>
                <EditOverlay></EditOverlay>
                <div class="sticky top-0 z-40 w-full backdrop-blur flex-none overflow-clip">
                    <div class="mx-auto">
                        <div class="border-b-2 border-slate-950/10 lg:px-8 dark:border-slate-300/10 px-3 lg:mx-0 flex flex-row items-center h-16 w-full overflow-clip">
                            <a
                                class="flex-0 p-4 md:hidden cursor-pointer select-none"
                                onClick={() => setExpandMenu(!expandMenu())}
                            >
                                <FaSolidBars class="mt-2" />
                            </a>
                            <div class="flex-1 sm:hidden" />
                            <div
                                class="flex-shrink flex cursor-pointer select-none h-full overflow-hidden"
                                onClick={() => navigate("/")}
                            >
                                <UserInstanceBanner />
                            </div>
                            <div class="flex-1" />
                            <Switch>
                                <Match when={authState()}>
                                    <div class="flex-0">
                                        <Menubar>
                                            <MenubarMenu>
                                                <MenubarTrigger>
                                                    <AvatarImage
                                                        user={
                                                            (
                                                                authState() as EphemeralSignedInState
                                                            ).accountData
                                                        }
                                                        imgClass="size-6"
                                                        class="inline sm:mr-2"
                                                        alt="Your avatar"
                                                    />
                                                    <span class="hidden sm:inline overflow-hidden text-ellipsis">
                                                        {`${
                                                            (
                                                                authState() as EphemeralSignedInState
                                                            ).accountData
                                                                .username
                                                        }@${
                                                            (
                                                                authState() as EphemeralSignedInState
                                                            ).domain
                                                        }`}
                                                    </span>
                                                </MenubarTrigger>
                                                <MenubarContent>
                                                    <MenubarItem
                                                        onClick={() => {
                                                            /*logOut(
                                                                        authContext
                                                                    );*/
                                                            navigate("/");
                                                        }}
                                                    >
                                                        Log out
                                                    </MenubarItem>

                                                    <MenubarItem
                                                        onClick={() => {
                                                            if (
                                                                window.localStorage.getItem(
                                                                    "theme"
                                                                ) === "dark" ||
                                                                (localStorage.getItem(
                                                                    "theme"
                                                                ) === null &&
                                                                    window.matchMedia(
                                                                        "(prefers-color-scheme: dark)"
                                                                    ).matches)
                                                            ) {
                                                                console.log(
                                                                    "switch to light theme"
                                                                );
                                                                window.localStorage.setItem(
                                                                    "theme",
                                                                    "light"
                                                                );
                                                                document.documentElement.classList.remove(
                                                                    "dark"
                                                                );
                                                            } else {
                                                                console.log(
                                                                    "switch to dark theme"
                                                                );
                                                                window.localStorage.setItem(
                                                                    "theme",
                                                                    "dark"
                                                                );
                                                                document.documentElement.classList.add(
                                                                    "dark"
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Toggle light/dark
                                                    </MenubarItem>

                                                    <MenubarItem
                                                        onClick={() => {
                                                            navigate(
                                                                "/dev/editDialog"
                                                            );
                                                        }}
                                                    >
                                                        Dev tools: edit dialog
                                                    </MenubarItem>
                                                </MenubarContent>
                                            </MenubarMenu>
                                        </Menubar>
                                    </div>
                                    <div class="flex-0 py-4 mx-4">
                                        <Button
                                            onClick={() =>
                                                editingOverlayContext.setShowingEditorOverlay(
                                                    true
                                                )
                                            }
                                        >
                                            Post
                                        </Button>
                                    </div>
                                </Match>
                                <Match when={authState.loading}>
                                    <div>
                                        i'm loading over here...
                                        <span class="animate-spin">🤔</span>
                                    </div>
                                </Match>
                                <Match when={authState() === false}>
                                    <div class="flex-0 py-4">
                                        <Button
                                            onClick={() =>
                                                navigate("/login", {
                                                    replace: true,
                                                })
                                            }
                                        >
                                            Log in
                                        </Button>
                                    </div>
                                </Match>
                            </Switch>
                        </div>
                    </div>
                </div>
                <Show when={authState() !== undefined}>{props.children}</Show>
            </div>
        </ExpandMenuSignalContext.Provider>
    );
};

export default AppFrame;
