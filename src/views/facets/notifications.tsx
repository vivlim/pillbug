import { useLocation, useNavigate } from "@solidjs/router";
import { Component, JSX } from "solid-js";
import { useAuthContext } from "~/lib/auth-context";

export const NotificationsFacet: Component = () => {
    const authContext = useAuthContext();

    const init = async () => {
        const authContext = useAuthContext();
    };

    init();

    const location = useLocation();
    const navigate = useNavigate();

    return <div class="border-2">placeholder for notification list</div>;
};
