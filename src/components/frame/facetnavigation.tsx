import { useLocation, useNavigate } from "@solidjs/router";
import { hrtime } from "process";
import {
    FaRegularBell,
    FaSolidBug,
    FaSolidCircle,
    FaSolidGear,
    FaSolidMagnifyingGlass,
    FaSolidPerson,
    FaSolidQuestion,
} from "solid-icons/fa";
import { Component, createResource, For, JSX, Show } from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import {
    LayoutLeftColumn,
    LayoutMainColumn,
} from "~/components/layout/columns";
import { cn } from "~/lib/utils";
import { useFrameContext } from "./context";

class FacetDefinition {
    constructor(public label: string, public url: string) {}
}

const FacetNavigationItem: Component<{
    children: JSX.Element;
    href: string;
}> = (props) => {
    const frameContext = useFrameContext();
    const activeClasses = ["active-facet", "font-bold"];
    const classes = [
        "facet-navigation-item",
        "block",
        "w-full",
        "p-3",
        "border-2",
        "border-transparent",
        "hover:border-fuchsia-900",
        "rounded-xl",
    ];
    const location = useLocation();
    if (location.pathname.startsWith(props.href)) {
        for (let c of activeClasses) {
            classes.push(c);
        }
    }

    return (
        <li class="flex flex-initial">
            <a
                class={cn(classes)}
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
                    "rounded-lg": true,
                    border: true,
                    "bg-card": true,
                    "text-card-foreground": true,
                    "shadow-sm": true,
                    fixed: true,
                    "col-span-full": true,
                    hidden: !frameContext.navPopupMenuOpen(),
                    "md:block": true,
                    "md:static": true,
                }}
            >
                <ul id="facet-menu" class="flex flex-col list-none p-6 gap-1">
                    <FacetNavigationItem href="/notifications">
                        <FaRegularBell />
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
                    <FacetNavigationItem href="/settings">
                        <FaSolidGear />
                        settings
                    </FacetNavigationItem>
                    <FacetNavigationItem href="/about">
                        <FaSolidQuestion />
                        about pillbug
                    </FacetNavigationItem>
                </ul>
            </div>
        </Show>
    );
};

export default FacetNavigation;
