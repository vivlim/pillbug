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
        const s = settings.getPersistent();
        for (const key in mappingTable) {
            const k = key as keyof FilterPropertiesByType<
                PersistentSettings,
                ColorSetting
            >;

            for (const variable of mappingTable[k]) {
                cssColor(document.body.style, variable, s[k]);
                /*
                if (s[k] === undefined) {
                    document.body.style.removeProperty(variable);
                } else {
                    document.body.style.setProperty(variable, cssColor(s[k]));
                }
                    */
            }
        }
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

function cssColor(
    target: CSSStyleDeclaration,
    k: string,
    c: HslColor | undefined
) {
    if (c === undefined) {
        target.removeProperty(k);
        target.removeProperty(k + "-h");
        target.removeProperty(k + "-s");
        target.removeProperty(k + "-l");
        return;
    }

    target.setProperty(k + "-h", `${c.h}`);
    target.setProperty(k + "-s", `${c.s * 100}%`);
    target.setProperty(k + "-l", `${c.l * 100}%`);
    target.setProperty(k, `var(${k}-h) var(${k}-s) var(${k}-l)`);

    // const result = `${c?.h} ${c?.s * 100}% ${c?.l * 100}%`;
    // console.log("color: " + result);

    // return result;
}
