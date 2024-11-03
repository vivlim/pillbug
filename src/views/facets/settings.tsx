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
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
    ColorSetting,
    FilterPropertiesByType,
    PersistentFlagNames,
    PersistentSettings,
    useSettings,
} from "~/lib/settings-manager";

const SettingsFacet: Component = () => {
    const settings = useSettings();
    const [time, setTime] = createSignal(DateTime.now());
    setInterval(() => {
        setTime(DateTime.now());
    }, 5000);
    return (
        <div class="flex flex-col w-full list-none p-6 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>settings</CardTitle>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>timestamps</CardTitle>
                </CardHeader>
                <CardContent class="px-4 pb-2">
                    <PersistentFlagCheckbox flag="useInternetTime">
                        Use internet time ("beats"){" "}
                        <a
                            href="http://gwil.co/internet-time/"
                            target="_blank"
                            class="underline"
                        >
                            read more
                        </a>
                    </PersistentFlagCheckbox>
                    <div class="flex flex-row items-center">
                        <h2>example:</h2>
                        <div class="m-2 p-2 border-2 rounded-md">
                            <Timestamp ts={time()} />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>appearance</CardTitle>
                </CardHeader>
                <CardContent class="px-4 pb-2">
                    <ul class="flex flex-col gap-4">
                        <PersistentFlagCheckbox flag="useFullQualityImagesAsThumbnails">
                            Show full quality images without having to click
                            into them first
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="imagesInPostsExpandToFullWidth">
                            Images in posts expand to the full width of the post
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="skipBlurHashClickThroughOnSensitiveMedia">
                            Skip needing to click through blurred previews of
                            sensitive media
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="unlimitedPostHeightInFeed">
                            Unlimited post height in feed (no 'show more')
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
                            may be subject to change
                        </h1>
                        <ColorSettingComponent key="primaryForegroundColor">
                            primary foreground
                        </ColorSettingComponent>
                        <ColorSettingComponent key="primaryBackgroundColor">
                            primary background
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
            <Card>
                <CardHeader>
                    <CardTitle>misc</CardTitle>
                </CardHeader>
                <CardContent class="px-4 pb-2">
                    <PersistentFlagCheckbox flag="enableDevTools">
                        Enable developer tools
                    </PersistentFlagCheckbox>
                    <PersistentFlagCheckbox flag="doNotPreloadNextPage">
                        Do not preload the next page when reaching the bottom of
                        a page
                    </PersistentFlagCheckbox>
                    <hr />
                    <PersistentFlagCheckbox flag="v2Feeds">
                        Enable feed filter editor
                        <ul>
                            <li>
                                the filter editor is unfinished and you probably
                                shouldn't try to use it in its current state.
                                the filters are only applied on the editor page
                                currently.
                            </li>
                        </ul>
                    </PersistentFlagCheckbox>
                </CardContent>
            </Card>
        </div>
    );
};

const PersistentFlagCheckbox: Component<{
    flag: PersistentFlagNames;
    children: JSX.Element;
}> = (props) => {
    const checkboxId = `flagToggle-${props.flag}`;
    const settings = useSettings();

    return (
        <li>
            <input
                type="checkbox"
                id={checkboxId}
                checked={settings.getPersistent()[props.flag] ?? false}
                onChange={(e) =>
                    settings.updatePersistent((s) => {
                        s[props.flag] = e.currentTarget.checked;
                    })
                }
            />
            <label for={checkboxId} class="pl-2 select-none">
                {props.children}
            </label>
        </li>
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

export default SettingsFacet;
