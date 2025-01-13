import {
    Component,
    createMemo,
    createResource,
    JSX,
    Match,
    Show,
    useContext,
} from "solid-js";
import { AvatarImage, AvatarLink } from "../user/avatar";
import { useAuth } from "~/auth/auth-manager";
import { unwrapResponse } from "~/lib/clientUtil";
import {
    FaRegularShareFromSquare,
    FaSolidLink,
    FaSolidShareFromSquare,
} from "solid-icons/fa";
import { logger } from "~/logging";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "pillbug-components/ui/context-menu";
import { Account } from "megalodon/lib/src/entities/account";
import { BsWindowPlus } from "solid-icons/bs";
import { useNavigate } from "@solidjs/router";
import { copyToClipboard } from "~/lib/utils";
import { getFsRoot, PillbugFilesystem } from "~/toolkit/files/opfs";
import { PreprocessedPostContext } from "../post/preprocessed";
import { DateTime } from "luxon";
import { ProcessedStatus } from "../feed/feed-engine";
import { Card } from "megalodon/lib/src/entities/card";
import { useSettings } from "~/lib/settings-manager";

export interface PostEmbeddedHyperlinkProps {
    href: string;
    text: string;
}

export const PostEmbeddedHyperlink: Component<PostEmbeddedHyperlinkProps> = (
    props
) => {
    const auth = useAuth();
    const settings = useSettings();
    const handleClick: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (
        e
    ) => {
        if (settings.getPersistent().linkHistory) {
            e.preventDefault();
            console.log(`link was clicked: ${props.href}`);
            UpdateLinkHistory(props.href, props.text);
        }
    };

    return (
        <>
            <a
                href={props.href}
                class="inline-block mx-1"
                onClick={handleClick}
            >
                link:{props.text}
            </a>
        </>
    );
};

export interface LinkHistoryRecord {
    link: string;
    text: string;
    post?: ProcessedStatus;
    when: string;
    card?: Card;
}

export async function UpdateLinkHistory(link: string, text: string) {
    const post = useContext(PreprocessedPostContext)?.status;
    const fs = await getFsRoot();
    const now = DateTime.now();
    const ts = now.toISO();
    const filenameTs = now.toFormat("yy-MM-dd_HH-mm-ss");
    const path = `linkHistory/${ts}.link.json`;
    let record: LinkHistoryRecord = {
        link,
        text,
        post,
        when: ts,
    };
    if (post?.status.card?.url === link) {
        record.card = post.status.card;
    }

    await PillbugFilesystem.value.writeText(
        path,
        JSON.stringify(record, null, 2),
        { append: false, line: false },
        logger
    );
    logger.info("wrote to link history", record);
}
