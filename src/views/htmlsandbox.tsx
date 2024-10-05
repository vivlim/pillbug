import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { createResource, JSX, Match, Switch, type Component } from "solid-js";
import { unified } from "unified";

export type HtmlSandboxProps = {
    html: string;
};

export interface HtmlPreviewSpanProps
    extends JSX.HTMLAttributes<HTMLSpanElement> {
    html: string;
    numChars: number;
}

const rehypeParser = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize)
    .use(rehypeStringify);

const previewParser = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, { ...defaultSchema, tagNames: [] }) // Replaces all tags with their contents, since we allow no tag names.
    .use(rehypeStringify);

const HtmlSandbox: Component<HtmlSandboxProps> = (props) => {
    const [sanitizedHtml] = createResource(props.html, async (fragment) => {
        const vfile = await rehypeParser.process(fragment);
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

export const HtmlPreviewSpan: Component<HtmlPreviewSpanProps> = (props) => {
    const [sanitizedHtml] = createResource(props.html, async (fragment) => {
        const vfile = await previewParser.process(fragment);
        const previewstr = String(vfile);
        if (previewstr.length > props.numChars) {
            return previewstr.substring(0, props.numChars) + "...";
        }
        return previewstr;
    });

    return <span>{sanitizedHtml()}</span>;
};

export default HtmlSandbox;
