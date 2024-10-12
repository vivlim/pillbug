import { Response } from "megalodon";

export function unwrapResponse<T>(response: Response<T>, label?: string | undefined) {
    if (label === undefined) {
        label = "Request";
    }
    if (response.status !== 200) {
        throw new Error(`${label} failed with code ${response.status}: ${response.statusText}`)
    }

    return response.data;
}