import { Match, Switch, type Component } from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import { RedirectComponent } from "~/components/utility/redirect-when-displayed";

const HomeView: Component = () => {
    const auth = useAuth();

    return (
        <Switch>
            <Match when={auth.signedIn}>
                <RedirectComponent redirectTarget="/feed" doRedirect={true} />
            </Match>
            <Match when={!auth.signedIn}>
                <RedirectComponent redirectTarget="/about" doRedirect={true} />
            </Match>
        </Switch>
    );
};

export default HomeView;
