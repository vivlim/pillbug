import {
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "@solidjs/router";
import { Entity } from "megalodon";
import {
    createEffect,
    createResource,
    createSignal,
    ErrorBoundary,
    For,
    Setter,
    type Component,
} from "solid-js";
import { AuthProviderProps, useAuthContext } from "~/lib/auth-manager";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import Post from "~/components/post";
import { Status } from "megalodon/lib/src/entities/status";
import { PostFeed } from "~/components/post/feed";

export interface SubmitFeedState {
    new_id: string;
}

const Feed: Component = () => {
    const location = useLocation<SubmitFeedState>();

    const [lastRefresh, setLastRefresh] = createSignal(Date.now());

    createEffect(() => {
        if (location.state?.new_id != null) {
            setLastRefresh(Date.now());
        }
    });

    return (
        <PostFeed
            onRequest={async (signedInState, timelineOptions) => {
                if (signedInState?.signedIn) {
                    return await signedInState.authenticatedClient.getHomeTimeline(
                        timelineOptions
                    );
                }
                return undefined;
            }}
            lastRefresh={lastRefresh()}
        />
    );
};

export default Feed;
