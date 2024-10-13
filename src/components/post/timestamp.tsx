import { Component, createMemo, JSX, splitProps } from "solid-js";
import { DateTime, FixedOffsetZone, Zone } from "luxon";
import { useSettings } from "~/lib/settings-manager";

type TimestampProvider = (ts: DateTime) => string;

const LocalTz: TimestampProvider = (ts) => {
    return ts.toLocal().toLocaleString({
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
    });
};

const InternetTime: TimestampProvider = (ts) => {
    // beats are relative to UTC+1
    const beatTz = ts.setZone("UTC+1");
    const date = beatTz.toLocaleString({
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const timeOfDay = beatTz.hour * 3600 + beatTz.minute * 60 + beatTz.second;
    const beatTime = (timeOfDay / 86.4).toFixed(2).toString().padStart(6, "0");
    return `${date} @${beatTime}`;
};

export interface TimestampProps
    extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, "title"> {
    ts: DateTime;
}

export const Timestamp: Component<TimestampProps> = (props) => {
    const [, rest] = splitProps(props, ["ts"]);
    const settings = useSettings();
    // TODO: support other timestamp providers
    const tsProvider = createMemo(() => {
        if (settings.getPersistent().useInternetTime) {
            return InternetTime;
        }
        return LocalTz;
    });
    const longString = props.ts.toLocaleString({
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
    });

    return (
        <span title={longString} {...rest}>
            {tsProvider()(props.ts)}
        </span>
    );
};
