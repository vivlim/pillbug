import { useNavigate } from "@solidjs/router";
import {
    Component,
    createEffect,
    createSignal,
    ErrorBoundary,
    For,
    JSX,
    lazy,
    Match,
    Show,
    Switch,
} from "solid-js";

export const RedirectComponent: Component<{
    doRedirect: boolean;
    redirectTarget: string;
}> = (props) => {
    const navigate = useNavigate();

    createEffect(() => {
        if (props.doRedirect) {
            navigate(props.redirectTarget);
        }
    });
    navigate("/feed");
    return (
        <Switch>
            <Match when={props.doRedirect}>
                <div>redirecting to {props.redirectTarget} now</div>
            </Match>
            <Match when={!props.doRedirect}>
                <div>redirecting to {props.redirectTarget}</div>
            </Match>
        </Switch>
    );
};
