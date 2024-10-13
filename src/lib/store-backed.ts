import { makePersisted, PersistenceOptions } from "@solid-primitives/storage";
import { createStore, SetStoreFunction } from "solid-js/store";


export abstract class StoreBacked<TStore extends object> {
    protected readonly store: TStore;
    protected readonly setStore: SetStoreFunction<TStore>;

    constructor(initial: TStore) {

        const [store, setStore] = createStore<TStore>(initial);
        this.store = store;
        this.setStore = setStore;
    }
}

export abstract class PersistentStoreBacked<TEphemeralStore extends object, TPersistentStore extends object> extends StoreBacked<TEphemeralStore> {
    protected readonly persistentStore: TPersistentStore;
    protected readonly setPersistentStore: SetStoreFunction<TPersistentStore>;

    constructor(initialEphemeral: TEphemeralStore, initialPersistent: TPersistentStore, persistentOptions: PersistenceOptions<any, any>) {
        super(initialEphemeral);
        const [store, setStore] = makePersisted(createStore<TPersistentStore>(initialPersistent), persistentOptions);
        this.persistentStore = store;
        this.setPersistentStore = setStore;
    }
}