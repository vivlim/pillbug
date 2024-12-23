import { Root } from "hast";
import { findAndReplace } from "hast-util-find-and-replace";
import { Entity } from "megalodon";
import { h } from "hastscript";

export interface RehypeEmojiOptions {
    emoji_defs?: Entity.Emoji[];
}

/**
 * Plugin for rehype to provide custom emoji via the Mastodon API.
 */
export default function rehypeEmoji(options: RehypeEmojiOptions) {
    // Create a map of emoji shortcodes for (hopefully) speed reasons
    const emojiMap = new Map(
        options.emoji_defs?.map((em) => [em.shortcode, em])
    );

    const replacer = ($0: string, $1: string) => {
        if (emojiMap.has($1)) {
            const emoji = emojiMap.get($1)!;
            const static_source = h('source', { class: 'h-full mx-auto', srcset: emoji.static_url, media: '(prefers-reduced-motion: reduced)' });
            const default_img = h('img', { class: 'h-full mx-auto', src: emoji.url, loading: "lazy", alt: emoji.shortcode });
            return h('picture', { class: 'inline-block h-[1.2em] aspect-square object-contain align-bottom align-center' }, static_source, default_img);
        } else {
            // Not a custom emoji we know about, ignore
            return $0;
        }
    };

    return function (tree: Root) {
        findAndReplace(tree, [[/:([\p{Letter}\d_]+):/gu, replacer]]);
    };
}
