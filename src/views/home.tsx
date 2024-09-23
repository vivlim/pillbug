import { A } from "@solidjs/router";
import { createResource, createSignal, type Component } from "solid-js";
import { tryGetAuthenticatedClient, useAuthContext } from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import NotSignedInLandingView from "./notsignedin";
import Feed from "./feed";

const HomeView: Component = () => {
    const authContext = useAuthContext();

    const [busy, setBusy] = createSignal(true);

    return (
        <>
            {!authContext.authState.signedIn && <NotSignedInLandingView />}
            {authContext.authState.signedIn && <Feed />}
        </>
    );
};

export default HomeView;
