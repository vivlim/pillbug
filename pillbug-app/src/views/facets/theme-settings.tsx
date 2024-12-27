import { DateTime } from "luxon";
import { ChromePicker, SketchPicker } from "solid-color";
import {
    Component,
    createSignal,
    createUniqueId,
    For,
    JSX,
    Match,
    Show,
    Switch,
} from "solid-js";
import { Timestamp } from "~/components/post/timestamp";
import { Button } from "pillbug-components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "pillbug-components/ui/card";
import {
    ColorSetting,
    FilterPropertiesByType,
    PersistentFlagNames,
    PersistentSettings,
    useSettings,
} from "~/lib/settings-manager";
import { PersistentFlagCheckbox } from "./settings";
import { UserProfile } from "../userprofile";
import { useAuth } from "~/auth/auth-manager";
import "./theme-settings.css";
import { PreprocessedPost } from "~/components/post/preprocessed";
import { ProcessedStatus } from "~/components/feed/feed-engine";

const ThemeSettingsFacet: Component = () => {
    const settings = useSettings();
    const [time, setTime] = createSignal(DateTime.now());
    setInterval(() => {
        setTime(DateTime.now());
    }, 5000);

    const auth = useAuth();

    const examplePosts: ProcessedStatus[] = [
        {
            status: {
                account: auth.assumeSignedIn.state.accountData,
                content:
                    "<p>this is an example post</p><blockquote>it contains a block quote</blockquote>as well as <code>some inline code</code><pre>and a code block</pre>",
                id: "null",
                uri: "#",
                in_reply_to_id: null,
                in_reply_to_account_id: null,
                reblog: null,
                plain_content: null,
                created_at: "1999-12-31T23:59:59.999Z",
                edited_at: null,
                emojis: [],
                replies_count: 0,
                reblogs_count: 0,
                favourites_count: 0,
                reblogged: null,
                favourited: null,
                muted: null,
                sensitive: false,
                spoiler_text: "",
                visibility: "public",
                media_attachments: [],
                mentions: [],
                tags: [],
                card: null,
                poll: null,
                application: null,
                language: null,
                pinned: null,
                emoji_reactions: [],
                quote: false,
                bookmarked: false,
            },
            labels: [],
            hide: false,
            collapseReasons: [],
            rawRuleResults: {
                positive: [],
                negative: [],
            },
            linkedAncestors: [],
        },
    ];
    return (
        <div class="flex flex-col w-full list-none p-6 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>appearance</CardTitle>
                </CardHeader>

                <CardContent class="px-4 pb-2">
                    <div class="themePreviews">
                        <div class="pbInput themePreview">
                            <For each={examplePosts}>
                                {(p) => (
                                    <PreprocessedPost
                                        status={p}
                                        limitInitialHeight={
                                            !(
                                                settings.getPersistent()
                                                    .unlimitedPostHeightInFeed ??
                                                false
                                            )
                                        }
                                    />
                                )}
                            </For>
                        </div>
                    </div>
                    <ul class="flex flex-col gap-4">
                        <PersistentFlagCheckbox flag="imagesInPostsExpandToFullWidth">
                            Images in posts expand to the full width of the post
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="flatAppearance">
                            flat appearance
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="beveledAppearance">
                            beveled appearance
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="unroundedCornersAppearance">
                            unrounded corners
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="alignColumnsLeft">
                            Align columns to the left instead of centering them
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="unlimitedColumnWidth">
                            UNLIMITED COLUMN WIDTH
                        </PersistentFlagCheckbox>
                    </ul>
                    <details class="pbInput">
                        <summary class="pbInput">color options (wip)</summary>
                        <h1 style="font-weight: bold">
                            note that these settings are a work in progress and
                            may be subject to change.
                        </h1>
                        <ColorSettingComponent key="primaryForegroundColor">
                            primary foreground
                        </ColorSettingComponent>
                        <ColorSettingComponent key="primaryBackgroundColor">
                            primary background
                        </ColorSettingComponent>
                        <ColorSettingComponent key="secondaryForegroundColor">
                            secondary foreground
                        </ColorSettingComponent>
                        <ColorSettingComponent key="secondaryBackgroundColor">
                            secondary background
                        </ColorSettingComponent>
                        <ColorSettingComponent key="pageForegroundColor">
                            page foreground
                        </ColorSettingComponent>
                        <ColorSettingComponent key="pageBackgroundColor">
                            page background
                        </ColorSettingComponent>
                        <ColorSettingComponent key="accentColor">
                            accent color
                        </ColorSettingComponent>
                        <ColorSettingComponent key="borderColor">
                            border color
                        </ColorSettingComponent>
                        <ColorSettingComponent key="cardForegroundColor">
                            card fg color
                        </ColorSettingComponent>
                        <ColorSettingComponent key="cardBackgroundColor">
                            card bg color
                        </ColorSettingComponent>
                    </details>
                </CardContent>
            </Card>
        </div>
    );
};

const ColorSettingComponent: Component<{
    key: keyof FilterPropertiesByType<PersistentSettings, ColorSetting>;
    children: JSX.Element;
}> = (props) => {
    const id = createUniqueId();
    const settings = useSettings();

    return (
        <div style="display: inline-block; margin: 0.2em;" class="pbInput">
            <Switch>
                <Match when={settings.getPersistent()[props.key] !== undefined}>
                    <h1>
                        <span style="font-weight: bold;">{props.children}</span>
                    </h1>
                </Match>
                <Match when={settings.getPersistent()[props.key] === undefined}>
                    <h1>
                        <span>{props.children}</span> (unset)
                    </h1>
                </Match>
            </Switch>
            <ChromePicker
                color={settings.getPersistent()[props.key]}
                onChangeComplete={(c) => {
                    settings.setPersistentStore(props.key, c.hsl);
                }}
                onSwatchHover={(c, e) => {}}
                onChange={(c, e) => {}}
            />
            <Switch>
                <Match when={settings.getPersistent()[props.key] !== undefined}>
                    <Button
                        style="margin-top: 0.1em; width: 100%;"
                        onClick={() => {
                            settings.setPersistentStore(props.key, undefined);
                        }}
                    >
                        reset
                    </Button>
                </Match>
                <Match when={settings.getPersistent()[props.key] === undefined}>
                    <Button style="margin-top: 0.1em; width: 100%;" disabled>
                        reset
                    </Button>
                </Match>
            </Switch>
        </div>
    );
};

export default ThemeSettingsFacet;
