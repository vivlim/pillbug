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
import { Component, For, JSX } from "solid-js";
import { useExpandMenuSignalContext } from "~/Frame";
import { useAuthContext } from "~/lib/auth-context";
import { cn } from "~/lib/utils";

class FacetDefinition {
    constructor(public label: string, public url: string) {}
}

const FacetNavigationItem: Component<{
    children: JSX.Element;
    href: string;
}> = (props) => {
    const expandMenuContext = useExpandMenuSignalContext();
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
                onClick={() => expandMenuContext.setMenuOpen(false)}
            >
                {props.children}
            </a>
        </li>
    );
};

export const FacetNavigationFrame: Component<{ children: JSX.Element }> = (
    props
) => {
    const authContext = useAuthContext();

    const init = async () => {
        const authContext = useAuthContext();
    };

    init();

    const location = useLocation();
    const navigate = useNavigate();
    const expandMenuContext = useExpandMenuSignalContext();

    const facets = [
        new FacetDefinition("notifications", "/notifications"),
        new FacetDefinition("notifications", "/notifications"),
        new FacetDefinition("notifications", "/notifications"),
        new FacetDefinition("notifications", "/notifications"),
        new FacetDefinition("notifications", "/notifications"),
    ];

    return (
        <div class="flex flex-grow flex-row mx-4 gap-4">
            <div
                classList={{
                    "w-64": true,
                    "rounded-lg": true,
                    border: true,
                    "bg-card": true,
                    "text-card-foreground": true,
                    "shadow-sm": true,
                    fixed: true,
                    "z-40": true,
                    hidden: !expandMenuContext.menuOpen(),
                    "md:flex-none": true,
                    "md:mt-4": true,
                    "md:flex": true,
                    "md:static": true,
                    "md:h-fit": true,
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
                    <FacetNavigationItem href="/profile">
                        <FaSolidPerson />
                        profile
                    </FacetNavigationItem>
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

            <div class="overflow-auto">{props.children}</div>
        </div>
    );
};
