import { Component, createMemo, createResource, Match, Show } from "solid-js";
import { AvatarLink } from "../user/avatar";
import { useAuth } from "~/auth/auth-manager";
import { unwrapResponse } from "~/lib/clientUtil";
import { FaSolidShareFromSquare } from "solid-icons/fa";
import { logger } from "~/logging";

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
                        href={`/user/${props.href}`}
                        class="inline-block mx-1"
                        title={`${props.href}`}
                    >
                        {props.text}
                    </a>
                    <a
                        href={props.href}
                        class="inline-block mx-1"
                        title={`${props.href} on remote instance`}
                    >
                        <FaSolidShareFromSquare class="size-4" />
                    </a>
                </>
            }
        >
            <a
                href={`/user/${richAcct()!.acct}`}
                class="inline-block mx-1"
                title={`${richAcct()!.acct}`}
            >
                <AvatarLink
                    user={richAcct()!}
                    imgClass="size-4"
                    class="inline-block"
                />
                <span>{props.text}</span>
            </a>
            <a
                href={props.href}
                class="inline-block mx-1"
                title={`${richAcct()!.acct} on remote instance`}
            >
                <FaSolidShareFromSquare class="size-4" />
            </a>
        </Show>
    );
};
