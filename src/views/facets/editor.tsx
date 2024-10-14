import { DateTime } from "luxon";
import {
    Accessor,
    Component,
    createMemo,
    createSignal,
    For,
    JSX,
    Show,
} from "solid-js";
import { Timestamp } from "~/components/post/timestamp";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { PersistentFlagNames, useSettings } from "~/lib/settings-manager";
import PostEditor from "../editdialog";
import { EditorComponent } from "~/components/editor/component";
import {
    EditorConfig,
    EditorDocument,
    EditorDocumentModel,
    EditorSubmitter,
    EditorValidator,
} from "~/components/editor/editor-types";

const EditorFacet: Component = () => {
    const settings = useSettings();
    const [time, setTime] = createSignal(DateTime.now());
    setInterval(() => {
        setTime(DateTime.now());
    }, 5000);
    const initialDoc: EditorDocument = {
        body: "",
        cwContent: "",
        cwVisible: false,
        visibility: "unlisted",
    };
    const model = new EditorDocumentModel(initialDoc);
    const validator = new EditorValidator();
    const submitter = new EditorSubmitter();
    const config: Accessor<EditorConfig> = createMemo(() => {
        return { bodyPlaceholder: "write a post..." };
    });
    return (
        <EditorComponent
            model={model}
            validator={validator}
            submitter={submitter}
            config={config()}
        ></EditorComponent>
    );
};

export default EditorFacet;
