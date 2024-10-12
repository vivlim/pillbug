import { DateTime } from "luxon";
import { Component, createSignal, For, Show } from "solid-js";
import { Timestamp } from "~/components/post/timestamp";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { useSettings } from "~/lib/settings-manager";

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
            <div class="grow place-self flex flex-col gap-5">
                <Card>
                    <CardHeader>
                        <CardTitle>timestamps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="checkbox"
                            id="toggleUseInternetTime"
                            checked={
                                settings.getPersistent().useInternetTime ??
                                false
                            }
                            onChange={(e) =>
                                settings.updatePersistent((s) => {
                                    s.useInternetTime = e.currentTarget.checked;
                                })
                            }
                        />
                        <label
                            for="toggleUseInternetTime"
                            class="pl-2 select-none"
                        >
                            Use internet time ("beats"){" "}
                            <a
                                href="http://gwil.co/internet-time/"
                                target="_blank"
                                class="underline"
                            >
                                read more
                            </a>
                        </label>
                        <div class="flex flex-row items-center">
                            <h2>example:</h2>
                            <div class="m-2 p-2 border-2 rounded-md">
                                <Timestamp ts={time()} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SettingsFacet;
