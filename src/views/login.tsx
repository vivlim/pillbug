import { useSearchParams } from "@solidjs/router";
import generator, { detector } from "megalodon";
import { createResource, createSignal, type Component } from "solid-js";
import { useAuthContext } from "~/App";
import { NewInstanceOauth } from "~/client/auth";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import {
    TextField,
    TextFieldInput,
    TextFieldLabel,
} from "~/components/ui/text-field";

const LoginView: Component = () => {
    const authContext = useAuthContext();

    const [searchParams, setSearchParams] = useSearchParams();

    const doOAuth = async () => {
        setBusy(true);
        try {
            let software = await detector(instance());
            authContext.setAuthState("instanceUrl", (_) => instance()); // Replace any existing app data. Probably shouldn't be able to do this if you are signed in!
            let client = generator(software, instance());
            let appData = await client.registerApp("pillbug", {
                redirect_uris: "http://localhost:3000/login", // code will be passed as get parameter 'code'
            });
            if (appData === undefined || appData.url === null) {
                setError("Failed to log in");
                setBusy(false);
                return;
            }
            authContext.setAuthState("appData", (_) => appData); // Replace any existing app data. Probably shouldn't be able to do this if you are signed in!
            console.log(JSON.stringify(authContext));
            alert("about to try to launch url");
            window.location.assign(appData.url);
        } catch (error) {
            if (error instanceof Error) {
                console.log(`error during login ${error.message}`);
                setError(error.message);
                setBusy(false);
            }
        }
    };

    const [instance, setInstance] = createSignal("");
    const [busy, setBusy] = createSignal(false);
    const [error, setError] = createSignal<string | undefined>(undefined);
    //const [appData] = createResource(instance, doOAuth);

    if (searchParams.code !== undefined) {
        setBusy(true);
        // test instanceurl
        console.log(
            `entered login for instance ${authContext.authState.instanceUrl} with a code`
        );
    }

    return (
        <Grid cols={1} colsMd={2} class="w-full gap-2">
            <Col span={1} spanMd={2}>
                <Card>
                    <CardHeader>
                        <CardTitle>pillbug</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TextField>
                            <TextFieldLabel for="instanceUrl">
                                Instance URL
                            </TextFieldLabel>
                            <TextFieldInput
                                type="url"
                                id="instanceUrl"
                                value={instance()}
                                onInput={(e) =>
                                    setInstance(e.currentTarget.value)
                                }
                                readOnly={busy()}
                            />
                        </TextField>
                        <Button onClick={doOAuth} disabled={busy()}>
                            Log in
                        </Button>
                        {error() !== undefined && <p>{error()}</p>}
                    </CardContent>
                </Card>
            </Col>
        </Grid>
    );
};

export default LoginView;
