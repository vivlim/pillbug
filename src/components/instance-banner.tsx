import { Component, Match, Show, Switch } from "solid-js";
import { Instance } from "megalodon/lib/src/entities/instance";
import { useAuth } from "~/auth/auth-manager";

export interface InstanceBannerProps {
    instance: Instance;
}

export const UserInstanceBanner: Component = () => {
    const auth = useAuth();

    return (
        <Switch>
            <Match when={auth.signedIn}>
                <InstanceBanner
                    instance={auth.assumeSignedIn.state.instanceData}
                />
            </Match>
            <Match when={!auth.signedIn}>
                <PillbugBanner />
            </Match>
        </Switch>
    );
};

export const InstanceBanner: Component<InstanceBannerProps> = (props) => {
    console.log(JSON.stringify(props));
    return (
        <>
            <Show when={props.instance?.thumbnail !== undefined}>
                <img
                    src={props.instance!.thumbnail!}
                    alt={`Logo for ${props.instance?.title}`}
                    class="pr-2 flex-0 py-2"
                />
            </Show>
            <div class="flex-1 text-lg self-center hidden sm:block  truncate">
                {props.instance.title}
            </div>
        </>
    );
};

export const PillbugBanner: Component = (props) => {
    return (
        <div class="p-4 flex gap-1">
            <span class="text-lg">pillbug</span>
            <span class="text-xs align-text-bottom">pre-alpha</span>
        </div>
    );
};
