import { A } from "@solidjs/router";
import { For, Match, Show, Switch, type Component } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/lib/auth-manager";

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
    new Feature("Sharing posts", false),
    new Feature("Searching for posts and users", false),
    new Feature("Tagging other users in posts", false),
    new Feature("Attaching images to new posts", false),
    new Feature("Using custom emoji in posts", false),
    new Feature("Previewing posts", false),
    new Feature("Content filtering rules", false),
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
    new Feature("Viewing notifications", true),
    new Feature("Viewing profiles", true),
    new Feature("Writing new posts", true),
    new Feature("Favoriting posts", true),
    new Feature("Replying to 'comments'", true),
    new Feature("Viewing images attached to posts", true),
    new Feature("Content warnings shown when viewing posts", true),
    new Feature("Custom emoji shown", true),
    new Feature("Multiple accounts", true),
    new Feature(
        "Right clicking the bottom of a post to see its raw json",
        true,
        ["doesn't work on comments yet, seems to also not work on mobile"]
    ),
];

const NotSignedInLandingView: Component = () => {
    const auth = useAuth();
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
                            <a
                                href="https://github.com/vivlim/pillbug"
                                class="underline"
                            >
                                it's a work in progress under active development
                                on GitHub.
                            </a>
                            &nbsp;features are currently missing and you will
                            probably encounter bugs.
                        </p>
                    </CardContent>
                </Card>
                <Show when={!auth.signedIn}>
                    <Card>
                        <CardContent>
                            <CardTitle>log in</CardTitle>
                        </CardContent>
                        <CardContent>
                            <p>you aren't logged in.</p>
                            <p>
                                ℹ️ note: following the addition of multiple
                                accounts, you will have to log in again. sorry!
                            </p>
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
