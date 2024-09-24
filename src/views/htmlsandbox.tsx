import { JSX, type Component } from "solid-js";

export type HtmlSandboxProps = {
    html: string;
};

const HtmlSandbox: Component<HtmlSandboxProps> = (props) => {
    const container: JSX.Element = <div class="html-sandbox"></div>;
    if (container === null || container === undefined) {
        return <div>unable to display content</div>;
    }
    const containerDomElement = container as Element;
    const shadow = containerDomElement.attachShadow({ mode: "open" });
    shadow.innerHTML = props.html;

    return container;
};

export default HtmlSandbox;
