import { DateTime } from "luxon";
import { Component, createSignal, For, JSX, Show } from "solid-js";
import { Timestamp } from "~/components/post/timestamp";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { PersistentFlagNames, useSettings } from "~/lib/settings-manager";

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
                        <PersistentFlagCheckbox flag="alignColumnsLeft">
                            Align columns to the left instead of centering them
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

export default SettingsFacet;
