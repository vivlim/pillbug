import { Entity } from "megalodon";
import rehypeParse from "rehype-parse";
import rehypeReact, { Options as RehypeReactOptions } from "rehype-react";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import {
    createEffect,
    createMemo,
    createResource,
    JSX,
    Match,
    ParentProps,
    Switch,
    type Component,
} from "solid-js";
import { unified } from "unified";
import rehypeEmoji from "~/lib/rehype-emoji";
import { Fragment, jsx, jsxs } from "solid-jsx";
import rehypeLinks from "~/lib/rehype-links";
import { Button } from "~/components/ui/button";
import {
    PostEmbeddedUserLink,
    PostEmbeddedUserLinkProps,
} from "~/components/post-embedded/user-link";
import rehypeWrapTextRoot from "~/lib/rehype-wrap-text-root";

export type HtmlSandboxProps = {
    html: string;
    emoji?: Entity.Emoji[];
};

export interface HtmlPreviewSpanProps
    extends JSX.HTMLAttributes<HTMLSpanElement> {
    html: string;
    numChars: number;
}

export const ParsedComponents = {
    Link: (props: JSX.HTMLAttributes<HTMLAnchorElement>) => (
        <a {...props}>{props.children}</a>
    ),
    UserLink: (props: PostEmbeddedUserLinkProps) => (
        <PostEmbeddedUserLink {...props} />
    ),
};

function jsxFactory(
    type: string | ((properties_: ParentProps) => JSX.Element),
    properties: ParentProps
): JSX.Element {
    if (
        typeof type === "string" &&
        ParsedComponents[type as keyof typeof ParsedComponents] !== undefined
    ) {
        return ParsedComponents[type as keyof typeof ParsedComponents](
            properties as any // unchecked properties. todo: add some checks
        );
    }
    return jsx(type, properties);
}

/**
 * Component for rendering arbitrary HTML (e.g. post content) more safely.
 */
const HtmlSandbox: Component<HtmlSandboxProps> = (props) => {
    const rehypeParser = createMemo(() =>
        unified()
            .use(rehypeParse, { fragment: true })
            .use(rehypeSanitize)
            .use(rehypeEmoji, { emoji_defs: props.emoji })
            .use(rehypeLinks, {})
            .use(rehypeWrapTextRoot, { tagName: "div" })
            .use(rehypeReact, rehypeReactOptions)
    );

    const [sanitizedHtml] = createResource(props.html, async (fragment) => {
        const vfile = await rehypeParser().process(fragment);
        return vfile.result;
    });

    return (
        <Switch>
            <Match when={sanitizedHtml.state === "ready"}>
                <div class="post-content overflow-auto">{sanitizedHtml()}</div>
            </Match>
            <Match when={sanitizedHtml.loading}>
                <div>sanitizing html...</div>
            </Match>
        </Switch>
    );

    /*
    // old stuff that used shadow dom
    const container: JSX.Element = <div class="html-sandbox text-wrap"></div>;
    if (container === null || container === undefined) {
        return <div>unable to display content</div>;
    }
    const containerDomElement = container as Element;
    const shadow = containerDomElement.attachShadow({ mode: "open" });
    shadow.innerHTML = props.html;

    return container;
    */
};

export interface StrictHtmlSandboxProps extends HtmlSandboxProps {
    class?: string;
}

const rehypeReactOptions: RehypeReactOptions = {
    Fragment,
    jsx: jsxFactory,
    jsxs: jsxFactory,
    elementAttributeNameCase: "html",
    stylePropertyNameCase: "css",
    passNode: true,
};

/**
 * Component similar to {@link HtmlSandbox}, but provides a span.
 *
 * Note that all tags are sanitized, but emoji are processed. This component is
 * primarily intended for elements with basic HTML and emoji capability, such as
 * in a user's profile.
 */
export const HtmlSandboxSpan: Component<StrictHtmlSandboxProps> = (props) => {
    const rehypeParser = createMemo(() =>
        unified()
            .use(rehypeParse, { fragment: true })
            .use(rehypeSanitize, { ...defaultSchema, tagNames: [] })
            .use(rehypeEmoji, { emoji_defs: props.emoji })
            .use(rehypeLinks, {})
            .use(rehypeWrapTextRoot, { tagName: "span" })
            .use(rehypeReact, rehypeReactOptions)
    );

    const [sanitizedHtml] = createResource(props.html, async (fragment) => {
        // logger.info("enter rehype parser fror " + props.html);
        const vfile = await rehypeParser().process(fragment);
        return vfile.result;
    });

    return (
        <Switch>
            <Match when={sanitizedHtml.state === "ready"}>
                <span class={props.class}>{sanitizedHtml()}</span>
            </Match>
            <Match when={sanitizedHtml.loading}>
                <span>sanitizing html...</span>
            </Match>
        </Switch>
    );
};

export default HtmlSandbox;
