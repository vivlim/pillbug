import { Button } from "~/components/ui/button";
import { A } from "@solidjs/router";
import { Entity, Response } from "megalodon";
import {
    Component,
    createEffect,
    createMemo,
    createResource,
    createSignal,
    For,
    lazy,
    Match,
    Show,
    Switch,
} from "solid-js";
import HtmlSandbox, { HtmlSandboxSpan } from "~/views/htmlsandbox";
import { useAuth } from "~/auth/auth-manager";
import { FaSolidLock } from "solid-icons/fa";
import { AvatarLink } from "./avatar";

/// Button that shows "Follow"/"Request to Follow"/"Unfollow"/"Cancel Request"
/// and acts accordingly when clicked
const FollowButton: Component<{ account: Entity.Account }> = (props) => {
    const auth = useAuth();

    if (!auth.signedIn) {
        // Nothing to request to follow/unfollow
        return <></>;
    }

    const client = auth.assumeSignedIn.client;

    const [busy, setBusy] = createSignal(false);
    const [userRel, relActions] = createResource(
        () => props.account.id,
        async (id) => await client.getRelationship(id)
    );

    // Follow/request to follow if not following/requested, and unfollow/cancel
    // request if followed/requested
    const toggleFollow = async () => {
        setBusy(true);
        const currentState = userRel();
        if (currentState == null) {
            // TODO: error
            return;
        }

        if (currentState.data.following || currentState.data.requested) {
            relActions.mutate(await client.unfollowAccount(props.account.id));
        } else {
            relActions.mutate(await client.followAccount(props.account.id));
        }
        setBusy(false);
    };

    return (
        <Show
            when={userRel() != null}
            fallback={<Button disabled={true}>Loading...</Button>}
        >
            <Button onClick={toggleFollow} disabled={busy()}>
                <Switch fallback={"Follow"}>
                    <Match
                        when={
                            props.account.locked &&
                            userRel()?.data.following == false &&
                            userRel()?.data.requested == false
                        }
                    >
                        Request to Follow
                    </Match>
                    <Match when={userRel()?.data.requested == true}>
                        Cancel Request
                    </Match>
                    <Match when={userRel()?.data.following == true}>
                        Unfollow
                    </Match>
                </Switch>
            </Button>
        </Show>
    );
};

const ProfileField: Component<{
    field: Entity.Field;
    emoji?: Entity.Emoji[];
}> = (props) => {
    return (
        <div class="mb-2">
            <div class="font-bold text-sm">
                <HtmlSandboxSpan html={props.field.name} emoji={props.emoji} />
            </div>
            <HtmlSandboxSpan html={props.field.value} emoji={props.emoji} />
        </div>
    );
};

export interface ProfileZoneProps {
    userInfo: Entity.Account;
}

/// The profile sidebar/header that appears on user profile and post pages
export const ProfileZone: Component<ProfileZoneProps> = (props) => {
    const auth = useAuth();
    const currentUser = createMemo(() => {
        if (auth.signedIn) {
            return auth.assumeSignedIn.state.accountData;
        } else {
            return null;
        }
    });

    return (
        <div class="md:w-72 p-8 md:flex-shrink-0 flex gap-4 min-h-max flex-col md:items-center justify-start bg-secondary text-secondary-foreground">
            <div class="flex flex-row md:flex-col md:items-center gap-4">
                <AvatarLink
                    user={props.userInfo}
                    imgClass="size-24"
                    class="shadow-md"
                />
                <div class="flex flex-col md:items-center">
                    <div class="flex flex-row items-center gap-2">
                        <h2 class="text-xl font-bold">
                            <HtmlSandboxSpan
                                html={props.userInfo.display_name}
                                emoji={props.userInfo.emojis}
                            />
                        </h2>
                        <Show when={props.userInfo.locked}>
                            <FaSolidLock
                                class="inline size-5"
                                aria-label="Locked account"
                                title="This account requires approval to be followed"
                            />
                        </Show>
                    </div>
                    <h3 class="text-sm">
                        <A href={`/user/${props.userInfo.acct}`}>
                            @{props.userInfo.acct}
                        </A>
                    </h3>
                </div>
            </div>
            <Show
                when={currentUser()?.id != props.userInfo.id}
                fallback={
                    <p class="text-sm text-muted-foreground">(it's you!)</p>
                }
            >
                <FollowButton account={props.userInfo} />
            </Show>
            <HtmlSandbox
                html={props.userInfo.note}
                emoji={props.userInfo.emojis}
            />
            <Show when={props.userInfo.fields.length > 0}>
                <hr class="border-accent-foreground w-full" />
                <div class="flex flex-col justify-start w-full">
                    <For each={props.userInfo.fields}>
                        {(field, index) => (
                            <ProfileField
                                field={field}
                                emoji={props.userInfo.emojis}
                            />
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};
