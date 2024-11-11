import { Entity } from "megalodon";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import {
    createEffect,
    createMemo,
    createResource,
    JSX,
    Match,
    Switch,
    type Component,
} from "solid-js";
import { unified } from "unified";
import rehypeEmoji from "~/lib/rehype-emoji";

export type HtmlSandboxProps = {
    html: string;
    emoji?: Entity.Emoji[];
};

export interface HtmlPreviewSpanProps
    extends JSX.HTMLAttributes<HTMLSpanElement> {
    html: string;
    numChars: number;
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
            .use(rehypeStringify)
    );

    const [sanitizedHtml] = createResource(props.html, async (fragment) => {
        const vfile = await rehypeParser().process(fragment);
        return String(vfile);
    });

    return (
        <Switch>
            <Match when={sanitizedHtml.state === "ready"}>
                <div
                    class="post-content overflow-auto break-words"
                    innerHTML={sanitizedHtml()}
                />
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
            .use(rehypeStringify)
    );

    const [sanitizedHtml] = createResource(props.html, async (fragment) => {
        // logger.info("enter rehype parser fror " + props.html);
        const vfile = await rehypeParser().process(fragment);
        return String(vfile);
    });

    return (
        <Switch>
            <Match when={sanitizedHtml.state === "ready"}>
                <span innerHTML={sanitizedHtml()} class={props.class} />
            </Match>
            <Match when={sanitizedHtml.loading}>
                <span>sanitizing html...</span>
            </Match>
        </Switch>
    );
};

export default HtmlSandbox;
