import { A, useParams } from "@solidjs/router";
import { Entity } from "megalodon";
import { createResource, createSignal, Show, type Component } from "solid-js";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-context";
import { ProfileZone } from "~/components/user/profile-zone";
import { GetTimelineOptions, PostFeed } from "~/components/post/feed";

interface GetAccountFeedOptions extends Omit<GetTimelineOptions, "local"> {
    pinned?: boolean;
    exclude_replies?: boolean;
    exclude_reblogs?: boolean;
    only_media?: boolean;
}

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
                <div class="grow flex flex-col justify-start">
                    <PostFeed
                        onRequest={(authContext, timelineOptions) => {
                            const acctFeedProps: GetAccountFeedOptions = {
                                exclude_replies: true,
                                ...timelineOptions,
                            };
                            if (!authContext.authState.signedIn) {
                                return;
                            }

                            // TODO: pinned statuses, somehow

                            const client =
                                authContext.authState.signedIn
                                    .authenticatedClient;
                            return client.getAccountStatuses(
                                userInfo()!.id,
                                acctFeedProps
                            );
                        }}
                    />
                </div>
            </div>
        </Show>
    );
};

export default UserProfile;
