import generator, { detector } from "megalodon";

export async function NewInstanceOauth(url: string) {
    let software = await detector(url);
    let client = generator(software, url);
    let appData = await client.registerApp('pillbug', {});
    return appData;
}