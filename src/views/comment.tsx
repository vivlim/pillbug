import { A } from "@solidjs/router";
import { Entity } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    createResource,
    createSignal,
    For,
    Setter,
    type Component,
} from "solid-js";
import { tryGetAuthenticatedClient } from "~/App";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Flex } from "~/components/ui/flex";
import { Grid, Col } from "~/components/ui/grid";
import HtmlSandbox from "./htmlsandbox";
import { useAuthContext } from "~/lib/auth-context";
import { Timestamp } from "~/components/post/timestamp";
import { DateTime } from "luxon";
import { AvatarLink } from "~/components/user/avatar";

export type CommentProps = {
    status: Status;
};

export const CommentPostComponent: Component<CommentProps> = (postData) => {
    const authContext = useAuthContext();
    const status = postData.status;

    const userHref = `/user/${status.account.acct}`;
    const postHref = `/post/${status.id}`;

    return (
        <>
            <div class="flex flex-row items-center flex-wrap border-b">
                <AvatarLink user={status.account} imgClass="size-6" />
                <A href={userHref} class="m-2">
                    {status.account.display_name}
                </A>
                <A href={userHref} class="m-1 text-neutral-500 text-sm">
                    {status.account.acct}
                </A>
                <A href={postHref} class="m-1 text-neutral-500 text-xs">
                    <Timestamp ts={DateTime.fromISO(status.created_at)} />
                </A>
            </div>
            <div class="md:px-3">
                <HtmlSandbox html={status.content} />
            </div>
        </>
    );
};
