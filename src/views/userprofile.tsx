import { A, useParams } from "@solidjs/router";
import { Entity } from "megalodon";
import {
    createResource,
    createSignal,
    For,
    Setter,
    Show,
    type Component,
} from "solid-js";
import { tryGetAuthenticatedClient } from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import Post from "./post";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-context";
import { ProfileZone } from "~/components/user/profile-zone";

type FeedProps = {
    firstPost?: number | null;
};

type GetTimelineOptions = {
    local?: boolean;
    limit?: number;
    max_id?: string;
    since_id?: string;
    min_id?: string;
};

const fetchUserInfo = async (
    authContext: AuthProviderProps,
    username: string
) => {
    if (!authContext.authState.signedIn) {
        return;
    }

    const client = authContext.authState.signedIn.authenticatedClient;
    console.log(`getting account ${username}`);

    const result = await client.lookupAccount(username);
    if (result.status !== 200) {
        throw new Error(`Failed to get user ${username}: ${result.statusText}`);
    }
    return result.data;
};

const UserProfile: Component = () => {
    const authContext = useAuthContext();
    const params = useParams();
    const [username, setUserName] = createSignal<string>(params.username);
    const [userInfo] = createResource(username, (u) =>
        fetchUserInfo(authContext, u)
    );

    return (
        <Show
            when={userInfo() != null}
            fallback={<div>Loading user profile</div>}
        >
            <div class="flex flex-col md:flex-row mx-1 md:mx-4 gap-4">
                <ProfileZone userInfo={userInfo()!} />
                <div class="grow flex flex-col justify-start"></div>
            </div>
        </Show>
    );
};

export default UserProfile;
