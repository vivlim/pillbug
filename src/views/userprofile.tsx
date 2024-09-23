import { A, useParams } from "@solidjs/router";
import { Entity } from "megalodon";
import {
    createResource,
    createSignal,
    For,
    Setter,
    type Component,
} from "solid-js";
import {
    AuthProviderProps,
    tryGetAuthenticatedClient,
    useAuthContext,
} from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import Post from "./post";

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
        <div class="flex flex-row p-8 size-full">
            <div class="md:grow"></div>
            <div class="grow w-max md:w-1/2 place-self">
                {userInfo.loading && <div>loading user</div>}
                <Card class="m-4">
                    <CardHeader>{userInfo()?.display_name}</CardHeader>
                    <CardContent>
                        <div>{userInfo()?.acct}</div>
                        <div>
                            <a href={userInfo()?.url}>{userInfo()?.url}</a>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div class="md:grow"></div>
        </div>
    );
};

export default UserProfile;
