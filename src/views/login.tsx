import { makePersisted } from "@solid-primitives/storage";
import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import generator, { detector } from "megalodon";
import { createResource, createSignal, Show, type Component } from "solid-js";
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
import {
    SessionAuthManager,
    useAuthContext,
    useSessionAuthManager,
} from "~/lib/auth-context";

const LoginView: Component = () => {
    const authManager = useSessionAuthManager();

    const [searchParams, setSearchParams] = useSearchParams();

    const doOAuth = async (authManager: SessionAuthManager) => {
        if (busy()) {
            console.log(
                "tried to enter oauth when already busy. taking no action"
            );
            return;
        }
        setBusy(true);
        try {
            const registration =
                await authManager.createNewInstanceRegistration(instance());
            if (registration.appData.url === null) {
                throw new Error("Client url is null");
            }

            // let's gooo
            window.location.assign(registration.appData.url);
        } catch (error) {
            if (error instanceof Error) {
                console.log(
                    `error during login ${error.message}\n${error.stack}`
                );
                setError(`${error.message}\n${error.stack}`);
                setBusy(false);
            }
        }
    };

    // persist the entered instance so that if you need to log again, it's already there.
    const [instance, setInstance] = makePersisted(createSignal(""));
    const [busy, setBusy] = createSignal(false);
    const [error, setError] = createSignal<string | undefined>(undefined);
    //const [appData] = createResource(instance, doOAuth);
    const navigate = useNavigate();

    if (searchParams.code !== undefined) {
        const getToken = async () => {
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

                authManager.completeLogin(searchParams.code!);
                setBusy(false);
                navigate("/");
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`error getting token ${error.message}`);
                    setError(error.message);
                    setBusy(false);
                }
            }
        };
        getToken();
    }

    return (
        <div class="flex flex-row p-8 size-full">
            <div class="md:grow"></div>
            <div class="grow w-max md:w-1/2 place-self">
                <Card>
                    <CardHeader>
                        <CardTitle>log in</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={async (ev) => {
                                ev.preventDefault();
                                await doOAuth(authManager);
                            }}
                            noValidate={true}
                        >
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
                            <Button
                                onClick={() => doOAuth(authManager)}
                                disabled={busy()}
                            >
                                Log in
                                {busy() && (
                                    <span class="animate-spin ml-3">🤔</span>
                                )}
                            </Button>
                            {error() !== undefined && <pre>{error()}</pre>}
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div class="md:grow"></div>
        </div>
    );
};

export default LoginView;
