import * as Comlink from "comlink";

Comlink.transferHandlers.set("fileChanged", {
    canHandle(obj) {
        return obj instanceof Event;
    },
    serialize(obj) {
        return obj
    },
    deserialize(obj) {
        return obj;
    }
})