import { Instance } from "megalodon/lib/src/entities/instance";
import { Component, createMemo, JSX, Show } from "solid-js";
import { useAuth } from "~/auth/auth-manager";

export type ShowIfInstanceProps = {
    children: JSX.Element;
    in?: "Website League" | undefined;
    when?: boolean;
};
export const ShowIfInstance: Component<ShowIfInstanceProps> = (props) => {
    const auth = useAuth();

    if (!auth.signedIn) {
        return <></>;
    }

    if (props.in === undefined) {
        return <></>;
    }

    const isInWebsiteLeague = createMemo(() =>
        checkIfInstanceIsInWebsiteLeague(auth.assumeSignedIn.state.instanceData)
    );

    if (props.in === "Website League") {
        if (isInWebsiteLeague()) {
            return <Show when={props.when}>{props.children}</Show>;
        }
    }
    return <></>;
};

/** Simple check for whether the instance is in the Website League, if so then Website League-specific functionality can be enabled. */
function checkIfInstanceIsInWebsiteLeague(instance: Instance): boolean {
    // At the moment, just check if the description contains "website league" case insensitively
    if (instance.description.toLowerCase().indexOf("website league") !== -1) {
        // Might be useful to have additional checks, e.g. to check the reachability of the broadcast account but this isn't intended at the moment to be a robust gate. those checks would likely make this function async.
        return true;
    }
    return false;
}
