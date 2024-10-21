import {
    Accessor,
    createContext,
    createSignal,
    For,
    JSX,
    Match,
    Setter,
    Show,
    Switch,
    useContext,
    type Component,
} from "solid-js";

import { useNavigate } from "@solidjs/router";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from "../ui/menubar";
import { Button } from "../ui/button";
import EditOverlay from "../../views/editoverlay";
import { useAuth } from "../../auth/auth-manager";
import { useEditOverlayContext } from "../../lib/edit-overlay-context";
import { FaSolidBars } from "solid-icons/fa";
import { AvatarImage } from "../user/avatar";
import { UserInstanceBanner } from "../instance-banner";
import { SignedInAccount, SignedInState } from "../../auth/auth-types";
import { FrameContext, useFrameContext } from "./context";
import FacetNavigationFrame, { FacetNavigation } from "./facetnavigation";
import {
    LayoutColumnsRoot,
    LayoutLeftColumn,
    LayoutLeftColumnPortal,
    LayoutMainColumn,
} from "../layout/columns";

const CurrentAccountWithAvatar: Component<{
    signInState: SignedInState;
}> = (props) => {
    return (
        <>
            <AvatarImage
                user={props.signInState.accountData}
                imgClass="size-6"
                class="inline sm:mr-2"
                alt="Your avatar"
            />
            <span class="hidden sm:inline overflow-hidden text-ellipsis">
                {`${props.signInState.accountData.username}@${props.signInState.domain}`}
            </span>
        </>
    );
};

const AvailableAccountWithAvatar: Component<{
    account: SignedInAccount;
}> = (props) => {
    return (
        <>
            <Show when={props.account.cachedAccount !== undefined}>
                <AvatarImage
                    user={props.account.cachedAccount!}
                    imgClass="size-6"
                    class="inline mr-2"
                    alt="Your avatar"
                />
            </Show>
            <span class="inline overflow-hidden text-ellipsis">
                {props.account.fullAcct}
            </span>
        </>
    );
};

const FrameTopBar: Component = (props) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const frameContext = useFrameContext();

    return (
        <div class="sticky top-0 z-40 w-full backdrop-blur flex-none overflow-clip">
            <div class="mx-auto">
                <div
                    id="layoutTopBar"
                    class="border-b-2 border-slate-950/10 lg:px-8 dark:border-slate-300/10 px-3 lg:mx-0 flex flex-row items-center w-full overflow-clip"
                >
                    <a
                        class="flex-0 p-4 md:hidden cursor-pointer select-none"
                        onClick={() =>
                            frameContext.setNavPopupMenuOpen(
                                !frameContext.navPopupMenuOpen()
                            )
                        }
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
                        <Match when={auth.signedIn}>
                            <div class="flex-0">
                                <Menubar>
                                    <MenubarMenu>
                                        <MenubarTrigger>
                                            <CurrentAccountWithAvatar
                                                signInState={
                                                    auth.assumeSignedIn.state
                                                }
                                            />
                                        </MenubarTrigger>
                                        <MenubarContent>
                                            <For each={auth.getAccountList()}>
                                                {(a, idx) => (
                                                    <MenubarItem
                                                        onClick={() =>
                                                            auth.switchActiveAccount(
                                                                idx()
                                                            )
                                                        }
                                                    >
                                                        <AvailableAccountWithAvatar
                                                            account={a}
                                                        />
                                                    </MenubarItem>
                                                )}
                                            </For>
                                            <MenubarSeparator />

                                            <MenubarItem
                                                onClick={() => {
                                                    navigate("/login");
                                                }}
                                            >
                                                Manage Accounts
                                            </MenubarItem>
                                            <MenubarSeparator />

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
                                        </MenubarContent>
                                    </MenubarMenu>
                                </Menubar>
                            </div>
                            <div class="flex-0 py-4 mx-4">
                                <Button onClick={() => navigate("/editor/new")}>
                                    Post
                                </Button>
                            </div>
                        </Match>
                        <Match when={auth.accountCount === 0}>
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
    );
};

const AppFrame: Component<{ children: JSX.Element }> = (props) => {
    const [showNav, setShowNav] = createSignal(true);
    const [navPopupMenuOpen, setNavPopupMenuOpen] = createSignal(false);

    return (
        <FrameContext.Provider
            value={{
                showNav,
                setShowNav,
                navPopupMenuOpen,
                setNavPopupMenuOpen,
            }}
        >
            <>
                <FrameTopBar />
                <div id="scrollableArea">
                    <LayoutColumnsRoot>
                        <LayoutLeftColumn />
                        <LayoutMainColumn>{props.children}</LayoutMainColumn>
                    </LayoutColumnsRoot>
                    <LayoutLeftColumnPortal>
                        <FacetNavigation />
                    </LayoutLeftColumnPortal>
                </div>
            </>
        </FrameContext.Provider>
    );
};

export default AppFrame;
