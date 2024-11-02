import { A, useParams } from "@solidjs/router";
import {
    createEffect,
    createMemo,
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
import { FeedManifest } from "~/components/feed/feed-engine";
import { Account } from "megalodon/lib/src/entities/account";
import { UserFeedSource } from "~/components/feed/sources/userfeed";
import { FeedComponent } from "~/components/feed";
import { defaultHomeFeedRules } from "~/components/feed/preset-rules";
import { unwrapResponse } from "~/lib/clientUtil";

export interface GetAccountFeedOptions
    extends Omit<GetTimelineOptions, "local"> {
    pinned?: boolean;
    exclude_replies?: boolean;
    exclude_reblogs?: boolean;
    only_media?: boolean;
}

export const fetchUserInfo = async (
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

const UserProfilePage: Component = () => {
    const params = useParams();
    const username = createMemo(() => params.username);
    return (
        <Show when={username() !== undefined}>
            <UserProfile acct={username()} />
        </Show>
    );
};
const UserProfile: Component<{ acct: string }> = (props) => {
    const auth = useAuth();

    const [account, accountActions] = createResource<
        Account | undefined,
        string,
        unknown
    >(
        () => props.acct,
        async (acct: string) => {
            // console.log(
            //     "entered user profile page resource fetcher for account " + acct
            // );
            const client = auth.client;
            if (client === undefined) {
                return undefined;
            }
            const account = unwrapResponse(await client.lookupAccount(acct));
            if (account?.id === undefined) {
                console.error(`user ${acct} doesn't exist?`);
                throw new Error(`user ${acct} doesn't exist?`);
            }

            return account;
        }
    );
    const manifest = createMemo(() => {
        const a = account();
        if (a !== undefined) {
            return {
                source: new UserFeedSource(auth, a.id, a.acct, true),
                fetchReferencedPosts: 5,
                postsPerPage: 10,
                postsToFetchPerBatch: 10,
            };
        }
    });

    createEffect(() => {
        props.acct;
        accountActions.refetch();
    });

    return (
        <ErrorBoundary
            fallback={(e) => (
                <ErrorBox error={e} description="Failed to load profile" />
            )}
        >
            <Show
                when={
                    !account.loading &&
                    account() != undefined &&
                    manifest() !== undefined
                }
                fallback={<div>Loading user profile</div>}
            >
                <div class="flex flex-col md:flex-row mx-1 md:mx-4 gap-4 justify-center">
                    <ProfileZone userInfo={account()!} />
                    <div class="flex-grow max-w-4xl flex flex-col justify-start">
                        <FeedComponent
                            manifest={manifest()!}
                            rules={defaultHomeFeedRules}
                            initialOptions={{}}
                        />

                        {/*
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
                                    userInfo().account!.id,
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
                                            userInfo().account!.id,
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
                        */}
                    </div>
                </div>
            </Show>
        </ErrorBoundary>
    );
};

export default UserProfilePage;
