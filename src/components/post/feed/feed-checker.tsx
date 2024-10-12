import {
    Component,
    createMemo,
    createResource,
    onCleanup,
    ResourceFetcherInfo,
    Show,
} from "solid-js";
import { useFeedContext } from "./feed-context";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/auth/auth-manager";
import { RequestHandler } from ".";

export interface FeedCheckerProps {
    checkHandler: RequestHandler;
    delayMs: number;
}

interface NewPostTracker {
    post_id?: string;
    count: number;
}

export const FeedChecker: Component<FeedCheckerProps> = (props) => {
    const feedContext = useFeedContext();
    const auth = useAuth();

    // function to check for whether there are new posts, and update accordingly
    const postChecker = async (cur: NewPostTracker) => {
        let since_id = cur.post_id;
        console.log(`Current post count: ${cur.count}`);
        if (since_id == undefined) {
            const newest_post = feedContext
                .postList()
                ?.find((post) => post.pinned == false);
            if (newest_post == undefined) {
                console.warn("Unable to get latest post info");
                return cur;
            }
            // Try to get newest post from the existing feed (excluding pinned)
            since_id = newest_post.id;
        }

        const params = {
            local: false,
            limit: 25,
            since_id: since_id,
        };

        let response = await props.checkHandler(auth, params);
        if (response == null) {
            console.warn(
                "While checking for new posts, got null from handler function"
            );
            return cur;
        }

        if (response.data.length > 0) {
            const topLevelPosts = response.data.filter(
                (post) =>
                    post.in_reply_to_id == null &&
                    post.reblog?.in_reply_to_id == null
            );
            console.log(`Found ${topLevelPosts.length} top-level posts`);
            cur.count += topLevelPosts.length;
            cur.post_id = response.data[0].id;
        }
        console.log(`Returning new count ${cur.count}`);
        return cur;
    };

    // resource to call said post checker
    const [newPostInfo, postInfoActions] = createResource(
        () => {
            return {
                count: 0,
            };
        },
        (cur: NewPostTracker, info: ResourceFetcherInfo<NewPostTracker>) =>
            postChecker(info.value ?? cur)
    );

    const checkTimer = setInterval(() => {
        if ((newPostInfo()?.count ?? 0) == 0) {
            console.log("checking for new posts...");
            postInfoActions.refetch();
        }
    }, props.delayMs);

    onCleanup(() => {
        console.log("cleaning up...");
        clearInterval(checkTimer);
    });

    const newPosts = createMemo((last) => {
        if (newPostInfo.loading) {
            return last;
        }

        const postInfo = newPostInfo()!;
        console.log(`newPostInfo exists! Count is ${postInfo.count}`);
        return postInfo.count > 0;
    }, false);

    return (
        <Show when={newPosts()}>
            <div class="md:px-12">
                <Button
                    variant="secondary"
                    class="w-full my-4"
                    onClick={() => {
                        feedContext.resetFeed();
                        postInfoActions.mutate({ count: 0 });
                    }}
                >
                    {"New posts available. Click here to refresh."}
                </Button>
            </div>
        </Show>
    );
};
