import { Accessor, createContext, Setter, useContext } from "solid-js";

export const FrameContext = createContext<FrameContextProps>();

export interface FrameContextProps {
    /** Whether the nav should be shown to the left if there is viewport space available */
    showNav: Accessor<boolean>;
    /** Sets whether the nav should be shown to the left if there is viewport space available */
    setShowNav: Setter<boolean>;

    /** Whether the nav menu is open if there is not viewport space available to just show it*/
    navPopupMenuOpen: Accessor<boolean>;
    /** Sets whether the nav menu is open if there is not viewport space available to just show it*/
    setNavPopupMenuOpen: Setter<boolean>;
}

export function useFrameContext(): FrameContextProps {
    const value = useContext(FrameContext);
    if (value === undefined) {
        throw new Error("FrameContext must be used within a provider");
    }
    return value;
}
