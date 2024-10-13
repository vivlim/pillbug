import { A, useNavigate, useParams } from "@solidjs/router";
import {
    createResource,
    createSignal,
    Match,
    Switch,
    type Component,
} from "solid-js";
import { tryGetAuthenticatedClient } from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import NotSignedInLandingView from "./notsignedin";
import Feed from "./feed";
import { useAuthContext, useAuth } from "~/lib/auth-context";
import { RedirectComponent } from "~/components/utility/redirect-when-displayed";

const HomeView: Component = () => {
    const authManager = useAuth();

    return (
        <Switch>
            <Match when={authManager.signedIn}>
                <RedirectComponent redirectTarget="/feed" doRedirect={true} />
            </Match>
            <Match when={!authManager.signedIn}>
                <RedirectComponent redirectTarget="/about" doRedirect={true} />
            </Match>
        </Switch>
    );
};

export default HomeView;
