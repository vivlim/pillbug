import {
    Component,
    createMemo,
    createResource,
    JSX,
    Match,
    Show,
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
} from "../ui/context-menu";
import { Account } from "megalodon/lib/src/entities/account";
import { BsWindowPlus } from "solid-icons/bs";
import { useNavigate } from "@solidjs/router";
import { copyToClipboard } from "~/lib/utils";

export interface PostEmbeddedUserLinkProps {
    href: string;
    text: string;
}

export const PostEmbeddedUserLink: Component<PostEmbeddedUserLinkProps> = (
    props
) => {
    const auth = useAuth();

    const [richAcct] = createResource(
        () => {
            return { ...props }; // Splatting props allows the resource to react to changes in them
        },
        async (props) => {
            try {
                let href = props.href;

                const results = unwrapResponse(
                    await auth.assumeSignedIn.client.search(href, {
                        resolve: false,
                        limit: 1,
                    })
                );
                if (results.accounts.length === 0) {
                    return undefined;
                }
                return results.accounts[0];
            } catch (e) {
                logger.warn("failed to populate rich account link", props, e);
                return undefined;
            }
        }
    );

    return (
        <Show
            when={!richAcct.loading && richAcct() !== undefined}
            fallback={
                <>
                    <a
                        href={props.href}
                        class="inline-block mx-1"
                        title={`${props.href}`}
                    >
                        {props.text}
                    </a>
                </>
            }
        >
            <UserContextMenu account={richAcct()!} href={props.href}>
                <ContextMenuTrigger
                    as="a"
                    href={`/user/${richAcct()!.acct}`}
                    class="inline-block mx-1"
                    title={`${richAcct()!.acct}`}
                >
                    {props.text}
                </ContextMenuTrigger>
            </UserContextMenu>
        </Show>
    );
};

export const ContextMenuItemLink: Component<{
    href: string;
    newWindow: boolean;
    children: JSX.Element;
}> = (props) => {
    const navigate = useNavigate();

    return (
        <ContextMenuItem
            class="py-4 md:py-2"
            onSelect={async () => {
                if (props.newWindow) {
                    window.open(props.href);
                } else {
                    navigate(props.href);
                }
            }}
        >
            {props.children}
        </ContextMenuItem>
    );
};

export const UserContextMenu: Component<{
    href: string;
    account: Account;
    children: JSX.Element;
}> = (props) => {
    const navigate = useNavigate();

    return (
        <ContextMenu>
            {props.children}
            <ContextMenuContent>
                <ContextMenuItemLink
                    href={`/user/${props.account.acct}`}
                    newWindow={false}
                >
                    <AvatarImage
                        user={props.account}
                        imgClass="size-6"
                        class="inline-block mr-2"
                    />
                    view&nbsp;<span>{props.account.display_name}</span>'s
                    profile
                </ContextMenuItemLink>
                <ContextMenuItemLink
                    href={`/user/${props.account.acct}`}
                    newWindow={true}
                >
                    <BsWindowPlus class="size-6 mr-2" />
                    ... in a new tab
                </ContextMenuItemLink>
                <ContextMenuItemLink href={props.href} newWindow={true}>
                    <FaRegularShareFromSquare class="size-6 mr-2" />
                    ... on {new URL(props.href).hostname}
                </ContextMenuItemLink>

                <ContextMenuItem
                    onSelect={async () => {
                        await copyToClipboard(props.href);
                    }}
                >
                    <FaSolidLink class="size-6 mr-2" />
                    copy '{props.href}'
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={async () => {
                        await copyToClipboard("@" + props.account.acct);
                    }}
                >
                    <FaSolidLink class="size-6 mr-2" />
                    copy '@{props.account.acct}'
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
