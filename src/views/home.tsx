import { A, useNavigate, useParams } from "@solidjs/router";
import { createResource, createSignal, type Component } from "solid-js";
import { tryGetAuthenticatedClient } from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import NotSignedInLandingView from "./notsignedin";
import Feed from "./feed";
import { useAuthContext, useSessionAuthManager } from "~/lib/auth-context";

const HomeView: Component = () => {
    const [busy, setBusy] = createSignal(true);
    const navigate = useNavigate();
    const [signedOut] = createResource(async () => {
        const authManager = useSessionAuthManager();
        if (authManager.checkAccountsExist()) {
            // Initialize the auth manager before bringing in other components
            const signedInState = await authManager.getSignedInState();
            if (signedInState?.signedIn) {
                navigate("/feed");
                return false;
            }
        }

        navigate("/about");
        return true;
    });

    return <div>redirecting... signed out: {signedOut()}</div>;
};

export default HomeView;
