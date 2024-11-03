import { HslColor } from "solid-color";
import { Component, createEffect, createMemo, JSX } from "solid-js";
import {
    ColorSetting,
    FilterPropertiesByType,
    PersistentSettings,
    useSettings,
} from "~/lib/settings-manager";
export const DynamicStyle: Component = (props) => {
    const settings = useSettings();
    createEffect(() => {
        const result: Record<string, string> = {};
        const s = settings.getPersistent();
        for (const key in mappingTable) {
            const k = key as keyof FilterPropertiesByType<
                PersistentSettings,
                ColorSetting
            >;

            for (const variable of mappingTable[k]) {
                if (s[k] === undefined) {
                    document.body.style.removeProperty(variable);
                } else {
                    result[variable] = cssColor(s[k]);
                    document.body.style.setProperty(variable, cssColor(s[k]));
                }
            }
        }
        return result;
    });
    return <></>;
};

const mappingTable: Record<
    keyof FilterPropertiesByType<PersistentSettings, ColorSetting>,
    string[]
> = {
    cardForegroundColor: ["--card-foreground"],
    cardBackgroundColor: ["--card"],
    primaryForegroundColor: ["--accent-foreground", "--primary-foreground"],
    primaryBackgroundColor: ["--primary"],
    secondaryForegroundColor: ["--secondary-foreground"],
    secondaryBackgroundColor: ["--secondary"],
    pageForegroundColor: ["--foreground"],
    pageBackgroundColor: ["--background"],
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
