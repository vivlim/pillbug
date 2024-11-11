import { A } from "@solidjs/router";
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
import {
    DropdownOrOtherComponentProps,
    IndexDropdown,
} from "~/components/dropdown-or-other";
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
                <CardContent>
                    <A
                        href="/settings/theme"
                        class="facet-navigation-item"
                        style="padding:0.5em; margin:0.5em; display: block;"
                    >
                        appearance settings
                    </A>
                </CardContent>
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
                    <CardTitle>tweaks</CardTitle>
                </CardHeader>
                <CardContent class="px-4 pb-2">
                    <ul class="flex flex-col gap-4">
                        <PersistentFlagCheckbox flag="useFullQualityImagesAsThumbnails">
                            Show full quality images without having to click
                            into them first
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="skipBlurHashClickThroughOnSensitiveMedia">
                            Skip needing to click through blurred previews of
                            sensitive media
                        </PersistentFlagCheckbox>
                        <PersistentFlagCheckbox flag="unlimitedPostHeightInFeed">
                            Unlimited post height in feed (no 'show more')
                        </PersistentFlagCheckbox>

                        <PersistentFlagCheckbox flag="showUnreadNotificationsIcon">
                            Show icon when accounts have unread notifications
                            (checks every 5 minutes, refresh the page after
                            changing this setting)
                        </PersistentFlagCheckbox>
                    </ul>
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
                    <Show when={settings.getPersistent().enableDevTools}>
                        <PersistentFlagCheckbox flag="globalState">
                            Make some state accessible in the javascript console
                            via <code>pillbug.*</code> (or{" "}
                            <code>window.pillbug.*</code>)
                        </PersistentFlagCheckbox>
                    </Show>

                    <IndexDropdown
                        value={settings.getPersistent().logLevel ?? 3}
                        setter={(l) =>
                            settings.setPersistentStore("logLevel", l)
                        }
                        labels={[
                            "silly",
                            "trace",
                            "debug",
                            "info",
                            "warn",
                            "error",
                            "fatal",
                        ]}
                    >
                        log level for your browser's javascript console:
                    </IndexDropdown>
                </CardContent>
            </Card>
        </div>
    );
};

export const PersistentFlagCheckbox: Component<{
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

export default SettingsFacet;
