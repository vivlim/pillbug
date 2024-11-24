import { Attachment } from "megalodon/lib/src/entities/attachment";
import {
    Component,
    createResource,
    createSignal,
    For,
    JSX,
    Match,
    Show,
    splitProps,
    Switch,
} from "solid-js";
import { cn } from "~/lib/utils";
import { ImageLightbox } from "./image-lightbox";
import { useSettings } from "~/lib/settings-manager";
import { decode } from "blurhash";
import { logger } from "~/logging";
import { RawDataViewer } from "../raw-data";
import { BlurHashImage, ClickThrough, ElementOverlay } from "./image-box";

export interface MediaAttachmentsProps
    extends JSX.HTMLAttributes<HTMLDivElement> {
    attachments: Array<Attachment>;
    sensitive: boolean;
}

export const MediaAttachments: Component<MediaAttachmentsProps> = (props) => {
    // Handle any non-image attachments; images are handled by ImageBox
    const attachments = props.attachments.filter((att) => att.type !== "image");

    return (
        <>
            <ul>
                <For each={attachments}>
                    {(att) => {
                        return (
                            <li>
                                <Switch
                                    fallback={
                                        <>
                                            <span>{att.type}</span>:
                                            <a href={att.url} class="underline">
                                                {att.url}
                                            </a>
                                            <details>
                                                <summary>details</summary>
                                                <RawDataViewer
                                                    data={att}
                                                    show={true}
                                                />
                                            </details>
                                        </>
                                    }
                                >
                                    <Match when={att.type === "audio"}>
                                        <AudioAttachmentPlayer
                                            attachment={att}
                                            sensitive={props.sensitive}
                                        />
                                    </Match>
                                    <Match when={att.type === "video"}>
                                        <VideoAttachmentPlayer
                                            attachment={att}
                                            sensitive={props.sensitive}
                                        />
                                    </Match>
                                </Switch>
                            </li>
                        );
                    }}
                </For>
            </ul>
        </>
    );
};

const AudioAttachmentPlayer: Component<{
    attachment: Attachment;
    sensitive: boolean;
}> = (props) => {
    return (
        <div class="pbCardSecondary">
            <Show
                when={
                    props.attachment.description !== null &&
                    props.attachment.description.length > 0
                }
            >
                <p>{props.attachment.description}</p>
            </Show>
            <audio controls>
                <source src={props.attachment.url}></source>
            </audio>
            <details>
                <summary>details</summary>
                <ul>
                    <Show when={props.attachment.meta !== null}>
                        <ObjectPropertyList object={props.attachment.meta} />
                    </Show>
                </ul>
            </details>
        </div>
    );
};

const VideoAttachmentPlayer: Component<{
    attachment: Attachment;
    sensitive: boolean;
}> = (props) => {
    if (props.attachment.type !== "video") {
        throw new Error("not a video");
    }

    const settings = useSettings();

    return (
        <div class="pbCardSecondary">
            <Show
                when={
                    props.attachment.description !== null &&
                    props.attachment.description.length > 0
                }
            >
                <p>{props.attachment.description}</p>
            </Show>
            <ClickThrough
                class={
                    settings.getPersistent().imagesInPostsExpandToFullWidth
                        ? "w-full"
                        : "m-auto"
                }
                initial={
                    <Switch
                        fallback={
                            <div class="pbCard">
                                click to play video (no preview available)
                            </div>
                        }
                    >
                        <Match
                            when={
                                props.attachment.preview_url !== null &&
                                !props.sensitive
                            }
                        >
                            <ElementOverlay overlayText="click to play video">
                                <img
                                    src={props.attachment.preview_url!}
                                    width={
                                        props.attachment.meta?.original?.width
                                    }
                                    height={
                                        props.attachment.meta?.original?.height
                                    }
                                    alt={
                                        props.attachment.description ??
                                        undefined
                                    }
                                    class="object-cover w-full"
                                    style={{
                                        "aspect-ratio":
                                            props.attachment.meta?.original
                                                ?.aspect ?? undefined,
                                    }}
                                />
                            </ElementOverlay>
                        </Match>
                        <Match
                            when={
                                props.sensitive &&
                                props.attachment.blurhash &&
                                props.attachment.meta?.original?.width &&
                                props.attachment.meta?.original?.height &&
                                props.attachment.meta?.original?.aspect
                            }
                        >
                            <ElementOverlay overlayText="click to play video">
                                <BlurHashImage
                                    blurhash={props.attachment.blurhash}
                                    width={
                                        props.attachment.meta!.original!.width!
                                    }
                                    height={
                                        props.attachment.meta!.original!.height!
                                    }
                                    alt={props.attachment.description!}
                                    class="object-cover w-full"
                                    style={{
                                        "aspect-ratio":
                                            props.attachment.meta!.original!
                                                .aspect,
                                    }}
                                />
                            </ElementOverlay>
                        </Match>

                        <Match
                            when={
                                props.sensitive &&
                                props.attachment.blurhash &&
                                props.attachment.meta?.small?.width &&
                                props.attachment.meta?.small?.height
                            }
                        >
                            <ElementOverlay overlayText="click to play video">
                                <BlurHashImage
                                    blurhash={props.attachment.blurhash}
                                    width={props.attachment.meta!.small!.width!}
                                    height={
                                        props.attachment.meta!.small!.height!
                                    }
                                />
                            </ElementOverlay>
                        </Match>
                    </Switch>
                }
            >
                <video controls>
                    <source src={props.attachment.url}></source>
                </video>
            </ClickThrough>

            <details>
                <summary>details</summary>
                <ul>
                    <Show when={props.attachment.meta !== null}>
                        <ObjectPropertyList object={props.attachment.meta} />
                    </Show>
                </ul>
            </details>
        </div>
    );
};

const ObjectPropertyList: Component<{ object: any }> = (props) => {
    const oprops = Object.keys(props.object);
    return (
        <For each={oprops}>
            {(p) => (
                <li>
                    <span>{p}</span>:{" "}
                    <span>{JSON.stringify(props.object[p])}</span>
                </li>
            )}
        </For>
    );
};
