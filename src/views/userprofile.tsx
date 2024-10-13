import { A, useParams } from "@solidjs/router";
import {
    createResource,
    createSignal,
    ErrorBoundary,
    Show,
    type Component,
} from "solid-js";
import { useAuth } from "~/auth/auth-manager";
import { ProfileZone } from "~/components/user/profile-zone";
import { GetTimelineOptions, PostFeed } from "~/components/post/feed";
import { ErrorBox } from "~/components/error";
import { MaybeSignedInState } from "~/auth/auth-types";

interface GetAccountFeedOptions extends Omit<GetTimelineOptions, "local"> {
    pinned?: boolean;
    exclude_replies?: boolean;
    exclude_reblogs?: boolean;
    only_media?: boolean;
}

const fetchUserInfo = async (
    signedInState: MaybeSignedInState,
    username: string
) => {
    if (!signedInState?.signedIn) {
        return;
    }

    const client = signedInState.authenticatedClient;
    console.log(`getting account ${username}`);

    const result = await client.lookupAccount(username);
    if (result.status !== 200) {
        throw new Error(`Failed to get user ${username}: ${result.statusText}`);
    }
    return result.data;
};

const UserProfile: Component = () => {
    const authManager = useAuth();
    const params = useParams();
    const [username, setUserName] = createSignal<string>(params.username);
    const [userInfo] = createResource(
        () => {
            return {
                username: username,
                signedInState: authManager.state,
            };
        },
        (args) => fetchUserInfo(args.signedInState, args.username())
    );

    return (
        <ErrorBoundary
            fallback={(e) => (
                <ErrorBox error={e} description="Failed to load profile" />
            )}
        >
            <Show
                when={userInfo() != null}
                fallback={<div>Loading user profile</div>}
            >
                <div class="flex flex-col md:flex-row mx-1 md:mx-4 gap-4 justify-center">
                    <ProfileZone userInfo={userInfo()!} />
                    <div class="flex-grow max-w-4xl flex flex-col justify-start">
                        <PostFeed
                            onRequest={async (
                                signedInState,
                                timelineOptions
                            ) => {
                                const acctFeedProps: GetAccountFeedOptions = {
                                    exclude_replies: true,
                                    ...timelineOptions,
                                };
                                if (!signedInState?.signedIn) {
                                    return undefined;
                                }

                                const client =
                                    signedInState.authenticatedClient;
                                let posts = await client.getAccountStatuses(
                                    userInfo()!.id,
                                    acctFeedProps
                                );

                                // If we're on the front page, get pinned posts
                                if (acctFeedProps.max_id == undefined) {
                                    let pinnedPostProps = {
                                        pinned: true,
                                        ...acctFeedProps,
                                    };
                                    let pinnedPosts =
                                        await client.getAccountStatuses(
                                            userInfo()!.id,
                                            pinnedPostProps
                                        );
                                    // HACK: this whole thing is kinda jank.
                                    // "pinned" is supposed to only apply for posts
                                    // *the requestor* pinned; for other profiles,
                                    // it's expected to be null.
                                    //
                                    // That said, we at least know there's no
                                    // situation where we're clobbering an otherwise
                                    // valid value.
                                    if (pinnedPosts.data.length > 0) {
                                        posts.data.unshift(
                                            ...pinnedPosts.data.map(
                                                (status) => {
                                                    status.pinned = true;
                                                    return status;
                                                }
                                            )
                                        );
                                    }
                                }

                                return posts;
                            }}
                        />
                    </div>
                </div>
            </Show>
        </ErrorBoundary>
    );
};

export default UserProfile;
