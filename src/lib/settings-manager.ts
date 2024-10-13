import { produce } from "solid-js/store";
import { PersistentStoreBacked } from "./store-backed";
import { useSessionContext } from "./session-context";

export function useSettings(): SettingsManager {
    const sessionContext = useSessionContext();
    return sessionContext.settingsManager;
}

export interface EphemeralSettings {
    version: 1
    kind: 'ephemeral'
}

export interface PersistentSettings {
    version: 1
    kind: 'persistent'
    useInternetTime?: boolean | undefined
}

export class SettingsManager extends PersistentStoreBacked<EphemeralSettings, PersistentSettings> {

    constructor() {
        super({ version: 1, kind: 'ephemeral' }, { version: 1, kind: 'persistent' }, { name: "pillbug-settings" });
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


}