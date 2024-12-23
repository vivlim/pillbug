import { Root } from "hast";
import { findAndReplace } from "hast-util-find-and-replace";
import { Entity } from "megalodon";
import { h } from "hastscript";
import { CONTINUE, visit } from "unist-util-visit";
import { logger } from "~/logging";
import { is } from "unist-util-is";
import rehypeSanitize from "rehype-sanitize";
import { toString } from "hast-util-to-string";

/**
 * Plugin which checks if the resulting tree's first element is 'text', and if so, wraps that in another element
 * rehype-react will not display bare text nodes.
 */
export default function rehypeWrapTextRoot(options: {
    /** tag name to inject if there is none */
    tagName: string
}) {
    return function (tree: Root) {
        const firstChild = tree.children[0];

        if (firstChild?.type !== "text") {
            return;
        }

        tree.children[0] = {
            type: "element",
            tagName: options.tagName,
            children: [firstChild],
            properties: {}
        }
    };
}
