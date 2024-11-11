import { ISettingsParam, Logger } from "tslog";

class PillbugLogger<T> extends Logger<T> {
    constructor(settings?: ISettingsParam<T>, logObj?: T) {
        super(settings, logObj);
        // @ts-ignore need to set this private var as a workaround for https://github.com/fullstack-build/tslog/issues/302
        this.stackDepthLevel = 6
    }
}
export const logger = new PillbugLogger<unknown>({ name: "app" })
