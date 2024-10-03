import { A } from "@solidjs/router";
import {
    createResource,
    createSignal,
    For,
    Match,
    Show,
    Switch,
    type Component,
} from "solid-js";
import { tryGetAuthenticatedClient } from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import { useAuthContext } from "~/lib/auth-context";

class Feature {
    public constructor(
        public label: string,
        public implemented: boolean,
        public details: string[] | undefined = undefined
    ) {}
}

const FeatureListItem: Component<{ feature: Feature }> = (props) => {
    return (
        <li class="my-2">
            <Switch>
                <Match when={props.feature.implemented}>✔️</Match>
                <Match when={!props.feature.implemented}>❌</Match>
            </Switch>
            <span class="ml-1">{props.feature.label}</span>
            <Show when={props.feature.details !== undefined}>
                <ul>
                    <For each={props.feature.details}>
                        {(f, index) => (
                            <li class="ml-8" style="list-style: disc;">
                                {f}
                            </li>
                        )}
                    </For>
                </ul>
            </Show>
        </li>
    );
};

const features: Feature[] = [
    new Feature("Interpreting replies as 'comments'", true),
    new Feature(
        "Interpreting boosts as shares without additional content",
        true
    ),
    new Feature(
        "Interpreting linked posts as shares with additional content",
        true,
        ["needs refinement but sorta works"]
    ),
    new Feature("Viewing home feed with pagination", true, [
        "an inconsistent number of posts are shown on each page, because replies are hidden",
    ]),
    new Feature("Viewing notifications", false),
    new Feature("Searching for posts and users", false),
    new Feature("Viewing profiles", false, [
        "barely implemented at the moment. need to combine this with the view for individual posts",
    ]),
    new Feature("Writing new posts", true),
    new Feature("Favoriting posts", true),
    new Feature("Sharing posts", false),
    new Feature("Replying to 'comments'", false),
    new Feature("Attaching images to new posts", false),
    new Feature("Viewing images attached to posts", false),
    new Feature("Content warnings shown when viewing posts", false),
    new Feature("Custom emoji shown", false),
    new Feature("Multiple accounts", false),
    new Feature(
        "Right clicking the bottom of a post to see its raw json",
        true,
        ["doesn't work on comments yet"]
    ),
];

const NotSignedInLandingView: Component = () => {
    const authContext = useAuthContext();
    return (
        <div class="flex flex-row p-8 size-full">
            <div class="md:grow"></div>
            <div class="grow w-max md:w-1/2 place-self flex flex-col gap-5">
                <Card>
                    <CardHeader>
                        <CardTitle>pillbug</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            pillbug is a cohost-inspired client for GoToSocial
                            and other Mastodon API-compatible ActivityPub
                            servers.
                        </p>
                        <p>
                            <a href="https://github.com/vivlim/pillbug">
                                it's a work in progress under active development
                                on GitHub.
                            </a>
                            &nbsp;features are currently missing and you will
                            probably encounter bugs.
                        </p>
                    </CardContent>
                </Card>
                <Show when={!authContext.authState.signedIn}>
                    <Card>
                        <CardContent>
                            <p>you aren't logged in.</p>
                            <p>
                                <A href="/login" class="underline">
                                    Log in
                                </A>
                            </p>
                        </CardContent>
                    </Card>
                </Show>
                <Card>
                    <CardHeader>
                        <CardTitle>current features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            this is not an exhaustive list of planned features,
                            and it is subject to change. also, a feature may be
                            listed here with a check mark which is "good enough
                            for now" but not in its final form.
                        </p>
                        <ul>
                            <For each={features}>
                                {(f, index) => <FeatureListItem feature={f} />}
                            </For>
                        </ul>
                    </CardContent>
                </Card>
            </div>
            <div class="md:grow"></div>
        </div>
    );
};

export default NotSignedInLandingView;
