import { Root } from "hast";
import { findAndReplace } from "hast-util-find-and-replace";
import { Entity } from "megalodon";
import { h } from "hastscript";
import { CONTINUE, visit } from "unist-util-visit";
import { logger } from "~/logging";
import { is } from "unist-util-is";
import rehypeSanitize from "rehype-sanitize";
import { toString } from "hast-util-to-string";

export interface RehypeLinksOptions {
}

const acctPattern = /@([^/]+)/

/**
 * Plugin for rehype to provide custom emoji via the Mastodon API.
 */
export default function rehypeLinks(options: RehypeLinksOptions) {
    return function (tree: Root) {
        visit(tree, { type: 'element', tagName: 'a' }, (node, index, parent) => {
            try {
                // Get the hyperlink label and assign it to 'text'
                const label = toString(node);
                node.properties['text'] = label;

                if (label.length > 0 && label[0] === "@") {
                    node.tagName = "UserLink"
                    return CONTINUE;
                }
                //node = h('Link', h('properties', h('children', node.children)))
                // do *not* change tagName unless we have a specific component we want to use - otherwise links may disappear
                //node.tagName = "Link"
                //node.properties['something'] = 'yeah'

                // normal links should open in a new window though - inject that property.
                node.properties['target'] = "_blank"
            } catch (e) {

                logger.warn("failed to parse hyperlink in post", tree, e);
                return undefined;
            }
            return CONTINUE
        })
    };
}
