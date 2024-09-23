import { makePersisted } from "@solid-primitives/storage";
import { useLocation, useSearchParams } from "@solidjs/router";
import generator, { detector } from "megalodon";
import { createResource, createSignal, type Component } from "solid-js";
import {
    GetClientError,
    tryGetUnauthenticatedClient,
    tryGetToken,
    useAuthContext,
    AppDisplayName,
} from "~/App";
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
        if (busy()) {
            console.log(
                "tried to enter oauth when already busy. taking no action"
            );
            return;
        }
        setBusy(true);
        try {
            let software = await detector(instance());
            console.log(`detected software '${software}' on ${instance()}`);

            // Set instance url and software in auth state. That's the minimum needed to get client
            authContext.setPersistentAuthState("instanceUrl", (_) =>
                instance()
            ); // Replace any existing app data. Probably shouldn't be able to do this if you are signed in!
            authContext.setPersistentAuthState(
                "instanceSoftware",
                (_) => software
            );

            let client = tryGetUnauthenticatedClient(authContext);

            let redirect_uri = window.location.href;
            if (window.location.search.length > 0) {
                redirect_uri = redirect_uri.substring(
                    0,
                    redirect_uri.length - window.location.search.length
                );
            }
            console.log(`redirect uri: ${redirect_uri}`);

            let appData = await client.registerApp(AppDisplayName, {
                redirect_uris: redirect_uri, // code will be passed as get parameter 'code'
            });
            if (appData === undefined || appData.url === null) {
                setError("Failed to log in");
                setBusy(false);
                return;
            }
            authContext.setPersistentAuthState("appData", (_) => appData); // Replace any existing app data. Probably shouldn't be able to do this if you are signed in!
            window.location.assign(appData.url);
        } catch (error) {
            if (error instanceof Error) {
                console.log(`error during login ${error.message}`);
                setError(error.message);
                setBusy(false);
            }
        }
    };

    // persist the entered instance so that if you need to log again, it's already there.
    const [instance, setInstance] = makePersisted(createSignal(""));
    const [busy, setBusy] = createSignal(false);
    const [error, setError] = createSignal<string | undefined>(undefined);
    //const [appData] = createResource(instance, doOAuth);

    const getToken = async () => {
        if (searchParams.code !== undefined) {
            if (busy()) {
                console.log(
                    "tried to enter getting token when already busy. taking no action"
                );
                return;
            }
            setBusy(true);
            try {
                console.log(
                    "trying to acquire a token using the provided code"
                );

                let authContext = useAuthContext();
                authContext.setPersistentAuthState(
                    "authorizationCode",
                    searchParams.code
                );
                await tryGetToken(authContext);
                console.log("got token!");
                setBusy(false);
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`error getting token ${error.message}`);
                    setError(error.message);
                    setBusy(false);
                }
            }
        }
    };
    getToken();

    return (
        <div class="flex flex-row p-8 size-full">
            <div class="md:grow"></div>
            <div class="grow w-max md:w-1/2 place-self">
                <Card>
                    <CardHeader>
                        <CardTitle>log in</CardTitle>
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
                            {busy() && (
                                <span class="animate-spin ml-3">🤔</span>
                            )}
                        </Button>
                        {error() !== undefined && <p>{error()}</p>}
                    </CardContent>
                </Card>
            </div>
            <div class="md:grow"></div>
        </div>
    );
};

export default LoginView;
