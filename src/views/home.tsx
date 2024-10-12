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
    const authManager = useSessionAuthManager();

    return (
        <div>
            redirecting... signed in:{" "}
            {authManager.checkSignedIn() ? "yes" : "no"}
        </div>
    );
};

export default HomeView;
