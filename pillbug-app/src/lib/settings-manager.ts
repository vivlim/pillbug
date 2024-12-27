import { produce } from "solid-js/store";
import { PersistentStoreBacked } from "./store-backed";
import { useSessionContext } from "./session-context";
import { createEffect } from "solid-js";
import { Color, HslColor } from "solid-color";
import { useAuth } from "pillbug-app";
import { attachFileLoggerTransport, logger } from "pillbug-app/logging";

export function useSettings(): SettingsManager {
    const sessionContext = useSessionContext();
    return sessionContext.settingsManager;
}

/** Highly convenient helper for checking the value of a user-configuable flag. Returns false if the user has not explicitly configured it. */
export function checkFlagSetting(flagName: PersistentFlagNames): boolean {
    const sessionContext = useSessionContext();
    const settings = sessionContext.settingsManager;
    return settings.getPersistent()[flagName] ?? false;
}

export interface EphemeralSettings {
    version: 1
    kind: 'ephemeral'
}

export interface PersistentSettings {
    version: 1
    kind: 'persistent'
    logLevel?: number
    saveLogs?: Flag
    useInternetTime?: Flag
    alignColumnsLeft?: Flag
    useFullQualityImagesAsThumbnails?: Flag
    imagesInPostsExpandToFullWidth?: Flag
    skipBlurHashClickThroughOnSensitiveMedia?: Flag
    enableDevTools?: Flag
    unlimitedPostHeightInFeed?: Flag
    unlimitedColumnWidth?: Flag
    v2Feeds?: Flag
    doNotPreloadNextPage?: Flag
    showUnreadNotificationsIcon?: Flag
    globalState?: Flag
    flatAppearance?: Flag
    beveledAppearance?: Flag
    unroundedCornersAppearance?: Flag
    pageForegroundColor?: ColorSetting
    pageBackgroundColor?: ColorSetting
    primaryForegroundColor?: ColorSetting
    primaryBackgroundColor?: ColorSetting
    secondaryForegroundColor?: ColorSetting
    secondaryBackgroundColor?: ColorSetting
    cardForegroundColor?: ColorSetting
    cardBackgroundColor?: ColorSetting
    accentColor?: ColorSetting
    borderColor?: ColorSetting
}

/** Configurable on-off flags which may be undefined until a user configures them. */
export type Flag = boolean | undefined;

/** Filter a type's properties to just those matching a provided type */
export type FilterPropertiesByType<Type, ValueType> = {
    [Property in keyof Type as Type[Property] extends ValueType ? Property : never]: Type[Property]
}

/** All of the properties of PersistentSettings which are flags. */
export type PersistentFlags = FilterPropertiesByType<PersistentSettings, Flag>;

/** A union type consisting of all of the boolean properties that belong to PersistentSettings. */
export type PersistentFlagNames = keyof PersistentFlags;

export type ColorSetting = HslColor | undefined;

export class SettingsManager extends PersistentStoreBacked<EphemeralSettings, PersistentSettings> {

    constructor() {
        super({ version: 1, kind: 'ephemeral' }, { version: 1, kind: 'persistent' }, { name: "pillbug-settings" });

        if (this.persistentStore.saveLogs) {
            attachFileLoggerTransport();
        }

        createEffect(() => {
            // Update document classes based on settings
            this.updateDocumentClassesFromSettings();

            if (this.persistentStore.logLevel !== undefined) {
                logger.settings.minLevel = this.persistentStore.logLevel;
            }
        })
    }


    public getEphemeral(): EphemeralSettings {
        return this.store;
    }

    public getPersistent(): PersistentSettings {
        return this.persistentStore;
    }

    public updateEphemeral(func: (settings: EphemeralSettings) => void) {
        this.setStore(produce(func))
    }

    public updatePersistent(func: (settings: PersistentSettings) => void) {
        this.setPersistentStore(produce(func))
    }

    private updateDocumentClassesFromSettings() {
        // Update document classes based on setting values.
        this.updateDocumentClass("alignColumnsLeft")
        this.updateDocumentClass("enableDevTools")
        this.updateDocumentClass("unlimitedColumnWidth")
        this.updateDocumentClass("flatAppearance")
        this.updateDocumentClass("beveledAppearance")
        this.updateDocumentClass("unroundedCornersAppearance")
    }


    /** Adds or removes a class from the document element based on a setting's key and value. */
    private updateDocumentClass(settingKey: PersistentFlagNames, className?: string | undefined) {
        const settingValue = this.persistentStore[settingKey];
        if (className === undefined) {
            // If a class name wasn't explicitly specified, derive it from the setting key
            className = `setting-${settingKey}`
        }
        if (settingValue) {
            document.documentElement.classList.add(className);
            document.documentElement.classList.remove(`not-${className}`);
        }
        else {
            document.documentElement.classList.remove(className);
            document.documentElement.classList.add(`not-${className}`);
        }
    }
}