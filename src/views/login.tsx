import { makePersisted } from "@solid-primitives/storage";
import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import generator, { detector } from "megalodon";
import {
    createResource,
    createSignal,
    For,
    Match,
    Show,
    Switch,
    type Component,
} from "solid-js";
import { NewInstanceOauth } from "~/client/auth";
import { ErrorBox } from "~/components/error";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import {
    TextField,
    TextFieldInput,
    TextFieldLabel,
} from "~/components/ui/text-field";
import { AvatarImage } from "~/components/user/avatar";
import {
    EphemeralSignedInState,
    SessionAuthManager,
    useAuthContext,
    useAuth,
} from "~/lib/auth-context";
import {
    SignedInAccount,
    useRawSessionContext,
    useSessionContext,
} from "~/lib/session-context";

const LoginView: Component = () => {
    const authManager = useAuth();

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
                setError(error);
                setBusy(false);
            }
        }
    };

    // persist the entered instance so that if you need to log again, it's already there.
    const [instance, setInstance] = makePersisted(createSignal(""));
    const [busy, setBusy] = createSignal(false);
    const [error, setError] = createSignal<Error | undefined>(undefined);
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

                await authManager.completeLogin(searchParams.code!);
                setBusy(false);
                navigate("/");
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`error getting token ${error.message}`);
                    setError(error);
                    setBusy(false);
                }
            }
        };
        getToken();
    }

    const auth = useAuth();

    return (
        <div class="flex flex-row p-8 size-full">
            <div class="md:grow"></div>
            <div class="grow w-max md:w-1/2 place-self flex flex-col gap-4">
                <Show when={authManager.signedIn}>
                    <ManageAccounts />
                </Show>
                <Card>
                    <CardHeader>
                        <Show when={!authManager.signedIn}>
                            <CardTitle>log in</CardTitle>
                        </Show>
                        <Show when={authManager.signedIn}>
                            <CardTitle>add another account</CardTitle>
                        </Show>
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
                            {error() !== undefined && (
                                <ErrorBox
                                    error={error()}
                                    description="Failed to log in"
                                />
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div class="md:grow"></div>
        </div>
    );
};

const ManageAccounts: Component = () => {
    const auth = useAuth();

    const accounts = () => {
        if (auth.currentAccountIndex === undefined) {
            throw new Error(
                "can't show account list when there is no current account."
            );
        }
        const accts = auth.getAccountList();
        const currentAccount = accts[auth.currentAccountIndex];
        return { currentAccount, otherAccounts: accts };
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>current account</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul class="flex flex-col w-full gap-4">
                        <ManageAccountItem
                            account={accounts().currentAccount}
                            index={auth.currentAccountIndex!}
                        />
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>switch account</CardTitle>
                </CardHeader>
                <CardContent>
                    <Switch>
                        <Match when={accounts().otherAccounts.length > 1}>
                            <div>
                                select one of these other accounts to switch to
                                it.
                            </div>
                            <ul class="flex flex-col w-full gap-4">
                                <For each={accounts().otherAccounts}>
                                    {(a, idx) => (
                                        <Show
                                            when={
                                                idx() !==
                                                auth.currentAccountIndex
                                            }
                                        >
                                            <ManageAccountItem
                                                account={a}
                                                index={idx()}
                                            />
                                        </Show>
                                    )}
                                </For>
                            </ul>
                        </Match>
                        <Match when={accounts().otherAccounts.length == 1}>
                            <div>
                                you aren't logged into any other accounts. if
                                you add another, it'll appear in a list here.
                            </div>
                        </Match>
                    </Switch>
                </CardContent>
            </Card>
        </>
    );
};

const ManageAccountItem: Component<{
    account: SignedInAccount;
    index: number;
}> = ({ account, index }) => {
    const auth = useAuth();

    return (
        <li class="flex grow flex-row items-center gap-2 border-2 rounded-lg p-2 hover:border-fuchsia-900">
            <button
                class="flex-1 flex flex-row items-center gap-2"
                onClick={() => auth.switchActiveAccount(index)}
            >
                <div class="flex-none">
                    <Show when={account.cachedAccount !== undefined}>
                        <AvatarImage
                            imgClass="size-16"
                            user={account.cachedAccount!}
                        />
                    </Show>
                </div>
                <ul class="flex-1 text-left">
                    <Show when={account.cachedAccount !== undefined}>
                        <li class="font-bold">
                            {account.cachedAccount!.display_name}
                        </li>
                        <li>{account.fullAcct}</li>
                    </Show>
                    <li>{account.instanceUrl}</li>
                </ul>
            </button>
            <button onClick={() => auth.removeAccount(index)}>log out</button>
        </li>
    );
};


export default LoginView;
