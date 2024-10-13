import { useLocation, useNavigate } from "@solidjs/router";
import { DateTime } from "luxon";
import {
    Notification,
    NotificationType,
} from "megalodon/lib/src/entities/notification";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Component,
    createResource,
    createSignal,
    For,
    JSX,
    Match,
    Show,
    Switch,
} from "solid-js";
import { RawDataViewer } from "~/components/raw-data";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { HtmlSandboxSpan } from "../htmlsandbox";
import { Timestamp } from "~/components/post/timestamp";
import { AvatarLink } from "~/components/user/avatar";
import { SessionAuthManager, useAuth } from "~/auth/auth-manager";

type NotificationDayGroups = {
    created_day: DateTime<true> | DateTime<false>;
    kindGroups: NotificationKindGroups[];
};

type NotificationKindGroups = {
    group: { type: string; status_id: string | undefined };
    items: Notification[];
};

async function getNotificationsAsync(
    auth: SessionAuthManager
): Promise<NotificationDayGroups[]> {
    const client = auth.assumeSignedIn.client;
    const notifications = await client.getNotifications({
        limit: 40,
    });

    if (notifications.status !== 200) {
        throw new Error(
            `Failed to get notifications: ${notifications.statusText}`
        );
    }

    const groupedByDay = groupBySerializedValue(notifications.data, (n) =>
        DateTime.fromISO(n.created_at).startOf("day")
    );

    const groupedByDayAndKind: NotificationDayGroups[] = groupedByDay.map(
        (dayGroup) => {
            return {
                created_day: dayGroup.group,
                kindGroups: groupBySerializedValue(dayGroup.items, (n) => {
                    return { type: n.type, status_id: n.status?.id };
                }),
            };
        }
    );
    return groupedByDayAndKind;
}

function groupBySerializedValue<TKey, TValue>(
    items: Iterable<TValue>,
    groupSelector: (value: TValue) => TKey
): { group: TKey; items: TValue[] }[] {
    const map = new Map<string, { group: TKey; items: TValue[] }>();

    for (const i of items) {
        const grouping = groupSelector(i);
        const key = JSON.stringify(grouping);
        var group: { group: TKey; items: TValue[] } | undefined = map.get(key);
        if (group === undefined) {
            group = { group: grouping, items: [] };
            map.set(key, group);
        }
        group.items.push(i);
    }

    return Array.from(map.values());
}

export const SingleLinePostPreviewLink: Component<{
    status: Status | undefined;
}> = (props) => {
    return (
        <>
            <Switch>
                <Match when={props.status !== undefined}>
                    <a
                        href={`/post/${props.status?.id}`}
                        class="underline flex flex-1 truncate min-w-16"
                    >
                        <HtmlSandboxSpan
                            class="truncate"
                            html={props.status!.content}
                            emoji={props.status!.emojis}
                        />
                    </a>
                </Match>
                <Match when={props.status === undefined}>
                    <p></p>
                </Match>
            </Switch>
        </>
    );
};

export const GroupedNotificationComponent: Component<{
    kindGroup: NotificationKindGroups;
}> = (props) => {
    const group = props.kindGroup.group;
    const notifications = props.kindGroup.items;
    const [showRaw, setShowRaw] = createSignal<boolean>(false);
    const status = notifications[0].status;

    let typeLabel = group.type;
    switch (group.type) {
        case "favourite":
            typeLabel = "liked your post";
            break;
        case "follow":
            typeLabel = "followed you";
            break;
        case "mention":
            typeLabel = "mentioned you";
            break;
        case "reblog":
            typeLabel = "shared your post";
            break;
        default:
            break;
    }

    const firstNotification = notifications[0];

    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger class="flex-auto" disabled>
                    <a class="flex flex-wrap w-full p-3 border-2 rounded-xl gap-1 my-2">
                        <Switch>
                            <Match when={notifications.length === 1}>
                                <Show when={firstNotification.account != null}>
                                    <AvatarLink
                                        user={firstNotification.account!}
                                        imgClass="size-6"
                                        class="inline-block underline"
                                    />
                                </Show>
                                <a
                                    href={`/user/${firstNotification.account?.acct}`}
                                    class="underline"
                                >
                                    {firstNotification.account?.acct}
                                </a>
                                <Switch>
                                    <Match when={status === undefined}>
                                        {typeLabel}
                                    </Match>
                                    <Match when={status !== undefined}>
                                        <a
                                            href={`/post/${status?.id}`}
                                            class="flex"
                                        >
                                            {typeLabel}
                                        </a>
                                        <SingleLinePostPreviewLink
                                            status={status}
                                        />
                                    </Match>
                                </Switch>
                            </Match>
                            <Match when={notifications.length > 1}>
                                <div>Several pages</div>
                                <Switch>
                                    <Match when={status === undefined}>
                                        {typeLabel}
                                    </Match>
                                    <Match when={status !== undefined}>
                                        <a
                                            href={`/post/${status?.id}`}
                                            class="flex"
                                        >
                                            {typeLabel}
                                        </a>
                                        <SingleLinePostPreviewLink
                                            status={status}
                                        />
                                    </Match>
                                </Switch>
                                <div class="w-full flex flex-row gap-1 overflow-hidden">
                                    <For each={notifications}>
                                        {(n, i) => (
                                            <>
                                                <a
                                                    href={`/user/${n.account?.acct}`}
                                                    class="flex"
                                                    title={`${n.account?.acct}`}
                                                >
                                                    <AvatarLink
                                                        user={n.account!}
                                                        imgClass="size-6"
                                                        class="inline-block"
                                                    />
                                                </a>
                                            </>
                                        )}
                                    </For>
                                </div>
                            </Match>
                        </Switch>
                    </a>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => setShowRaw(!showRaw())}>
                        Show JSON
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <RawDataViewer data={props.kindGroup} show={showRaw()} />
        </>
    );
};

export const NotificationsFacet: Component = () => {
    const auth = useAuth();

    const [notifications] = createResource(auth, (ac) => {
        return getNotificationsAsync(ac);
    });

    const location = useLocation();
    const navigate = useNavigate();

    return (
        <ul class="flex flex-col w-full list-none p-6 gap-4">
            <For each={notifications()}>
                {(dayGroup, index) => (
                    <div>
                        <div>
                            <Timestamp ts={dayGroup.created_day} />
                        </div>
                        <For each={dayGroup.kindGroups}>
                            {(kindGroup, index) => (
                                <GroupedNotificationComponent
                                    kindGroup={kindGroup}
                                />
                            )}
                        </For>
                    </div>
                )}
            </For>
        </ul>
    );
};
export default NotificationsFacet;
