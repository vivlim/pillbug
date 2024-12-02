import { useLocation, useNavigate } from "@solidjs/router";
import { hrtime } from "process";
import {
    FaRegularBell,
    FaSolidBell,
    FaSolidBug,
    FaSolidCircle,
    FaSolidFolder,
    FaSolidGear,
    FaSolidMagnifyingGlass,
    FaSolidPeopleGroup,
    FaSolidPerson,
    FaSolidQuestion,
    FaSolidToolbox,
    FaSolidWrench,
} from "solid-icons/fa";
import {
    Component,
    createEffect,
    createMemo,
    createResource,
    For,
    JSX,
    Match,
    Show,
    Switch,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import {
    LayoutLeftColumn,
    LayoutMainColumn,
} from "~/components/layout/columns";
import { cn } from "~/lib/utils";
import { useFrameContext } from "./context";
import { useSettings } from "~/lib/settings-manager";

class FacetDefinition {
    constructor(public label: string, public url: string) {}
}

const FacetNavigationItem: Component<{
    children: JSX.Element;
    href: string;
}> = (props) => {
    const frameContext = useFrameContext();
    const classList = createMemo(() => {
        const location = useLocation();
        const isActive = location.pathname.startsWith(props.href);

        return {
            ["facet-navigation-item"]: true,
            ["block"]: true,
            ["w-full"]: true,
            ["p-3"]: true,
            ["border-2"]: true,
            ["border-transparent"]: true,
            ["hoverAccentBorder"]: true,
            ["active-facet"]: isActive,
            ["font-bold"]: isActive,
        };
    });

    return (
        <li class="flex flex-initial">
            <a
                classList={classList()}
                href={props.href}
                onClick={() => frameContext.setNavPopupMenuOpen(false)}
            >
                {props.children}
            </a>
        </li>
    );
};

export const FacetNavigation: Component = (props) => {
    const auth = useAuth();
    const settings = useSettings();

    const profileUrl = () => {
        if (auth.signedIn) {
            return `/user/${auth.assumeSignedIn.state.accountData.acct}`;
        }
        return undefined;
    };

    const frameContext = useFrameContext();

    return (
        <Show when={frameContext.showNav() || frameContext.navPopupMenuOpen()}>
            <div
                classList={{
                    "m-2": true,
                    "w-full": true,
                    "text-card-foreground": true,
                    fixed: true,
                    "col-span-full": true,
                    hidden: !frameContext.navPopupMenuOpen(),
                    "md:block": true,
                    "md:static": true,
                }}
                style="z-index: 999; margin-top: 0px;"
            >
                <ul
                    id="facet-menu"
                    class="pbCard pbGlideIn flex flex-col list-none p-6 gap-1"
                >
                    <FacetNavigationItem href="/notifications">
                        <Show
                            when={auth.activeAccountHasUnreadNotifications()}
                            fallback={<FaRegularBell />}
                        >
                            <FaSolidBell />
                        </Show>
                        notifications
                    </FacetNavigationItem>
                    <FacetNavigationItem href="/search">
                        <FaSolidMagnifyingGlass />
                        search
                    </FacetNavigationItem>
                    <Show when={profileUrl() !== undefined}>
                        <FacetNavigationItem href={profileUrl()!}>
                            <FaSolidPerson />
                            profile
                        </FacetNavigationItem>
                    </Show>
                    <FacetNavigationItem href="/following">
                        <FaSolidPeopleGroup />
                        following (wip)
                    </FacetNavigationItem>
                    <FacetNavigationItem href="/settings">
                        <FaSolidGear />
                        settings
                    </FacetNavigationItem>
                    <FacetNavigationItem href="/about">
                        <FaSolidQuestion />
                        about pillbug
                    </FacetNavigationItem>
                    <Show when={settings.getPersistent().enableDevTools}>
                        <FacetNavigationItem href="/dev/editDialog">
                            <FaSolidWrench />
                            test editor
                        </FacetNavigationItem>
                        <FacetNavigationItem href="/files">
                            <FaSolidFolder />
                            filesystem
                        </FacetNavigationItem>
                    </Show>
                    <Show when={settings.getPersistent().v2Feeds}>
                        <FacetNavigationItem href="/feed-builder">
                            <FaSolidToolbox />
                            feed rule editor (wip)
                        </FacetNavigationItem>
                    </Show>
                </ul>
            </div>
        </Show>
    );
};

export default FacetNavigation;
