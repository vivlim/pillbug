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
                if (node.children.length === 2) {
                    if (node.children[0].type === 'text' && node.children[0].value === '@' && node.properties['href']) {
                        node.tagName = "UserLink"
                        node.properties['text'] = toString(node);
                        return CONTINUE;
                    }
                }
                //node = h('Link', h('properties', h('children', node.children)))
                node.tagName = "Link"
                node.properties['something'] = 'yeah'
            } catch (e) {

                logger.warn("failed to parse hyperlink in post", tree, e);
                return undefined;
            }
            return CONTINUE
        })
    };
}
