import { A, useNavigate, useParams } from "@solidjs/router";
import { createResource, createSignal, type Component } from "solid-js";
import { tryGetAuthenticatedClient } from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import NotSignedInLandingView from "./notsignedin";
import Feed from "./feed";
import { useAuthContext } from "~/lib/auth-context";

const HomeView: Component = () => {
    const authContext = useAuthContext();
    const [busy, setBusy] = createSignal(true);
    const navigate = useNavigate();

    if (authContext.authState.signedIn) {
        navigate("/feed");
    } else {
        navigate("/about");
    }

    return <>{authContext.authState.signedIn && <div>redirecting...</div>}</>;
};

export default HomeView;
