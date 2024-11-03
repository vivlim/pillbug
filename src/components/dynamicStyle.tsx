import { HslColor } from "solid-color";
import { Component, createMemo, JSX } from "solid-js";
import {
    ColorSetting,
    FilterPropertiesByType,
    PersistentSettings,
    useSettings,
} from "~/lib/settings-manager";
export const DynamicStyle: Component<{ children: JSX.Element }> = (props) => {
    const settings = useSettings();
    const cssVars = createMemo(() => {
        const result: Record<string, string> = {};
        const s = settings.getPersistent();
        for (const key in mappingTable) {
            const k = key as keyof FilterPropertiesByType<
                PersistentSettings,
                ColorSetting
            >;
            if (s[k] === undefined) {
                continue;
            }

            for (const variable of mappingTable[k]) {
                result[variable] = cssColor(s[k]);
            }
        }
        return result;
    });

    return (
        <>
            <div style={cssVars()}>{props.children}</div>
        </>
    );
};

const mappingTable: Record<
    keyof FilterPropertiesByType<PersistentSettings, ColorSetting>,
    string[]
> = {
    cardForegroundColor: ["--card-foreground"],
    cardBackgroundColor: ["--card"],

    primaryForegroundColor: [
        "--foreground",
        "--accent-foreground",
        "--primary-foreground",
    ],
    primaryBackgroundColor: ["--background", "--primary"],
    borderColor: ["--border"],
    accentColor: ["--accent"],
};

function cssColor(c: HslColor | undefined): string {
    if (c === undefined) {
        c = { h: 0, s: 0, l: 0 };
    }
    const result = `${c?.h} ${c?.s * 100}% ${c?.l * 100}%`;
    console.log("color: " + result);
    return result;
}
