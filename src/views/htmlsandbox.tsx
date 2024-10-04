import rehypeParse from "rehype-parse";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { createResource, JSX, Match, Switch, type Component } from "solid-js";
import { unified } from "unified";

export type HtmlSandboxProps = {
    html: string;
};

const rehypeParser = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize)
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

export default HtmlSandbox;
