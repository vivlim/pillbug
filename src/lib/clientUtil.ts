import { DateTime, Duration } from "luxon";
import { Response } from "megalodon";

export function unwrapResponse<T>(response: Response<T>, label?: string | undefined) {
    if (label === undefined) {
        label = "Request";
    }
    if (response.status !== 200 && response.status !== 202) {
        throw new Error(`${label} failed with code ${response.status}: ${response.statusText}`)
    }

    return response.data;
}

export async function unwrapLoggedResponseAsync<T>(responsePromise: Promise<Response<T>>, requestLabel: string, whyLabel: string, responseLabeler: (x: T) => string, logger: (lr: LoggedRequest) => void): Promise<T> {
    const start = DateTime.now()
    try {
        const result = unwrapResponse(await responsePromise);
        logger(new LoggedRequest(start, requestLabel, whyLabel, responseLabeler(result), true, undefined))
        return result;
    }
    catch (e) {
        if (e instanceof Error) {
            logger(new LoggedRequest(start, requestLabel, whyLabel, undefined, false, e))
        }
        else {
            logger(new LoggedRequest(start, requestLabel, whyLabel, undefined, false, new Error("unknown error")))
        }
        throw e;
    }
}

export class LoggedRequest {
    public readonly duration: Duration<true>
    constructor(
        public ts: DateTime,
        public requestLabel: string,
        public whyLabel: string,
        public responseLabel: string | undefined,
        public success: boolean,
        public error: Error | undefined
    ) {
        const now = DateTime.now()
        this.duration = now.diff(ts)

    }
}