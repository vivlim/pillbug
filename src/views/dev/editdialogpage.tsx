import { DateTime } from "luxon";
import {
    Accessor,
    Component,
    createMemo,
    createSignal,
    For,
    JSX,
    Setter,
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
    ValidationError,
} from "~/components/editor/editor-types";
import { RawDataViewer } from "~/components/raw-data";
import { Button } from "~/components/ui/button";

const DevEditDialogPage: Component = () => {
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

    const [allowValidation, setAllowValidation] = createSignal(true);
    const [allowSubmit, setAllowSubmit] = createSignal(true);
    const [submission, setSubmission] = createSignal<
        EditorDocument | undefined
    >(undefined);

    const validator = new MockValidator(allowValidation);
    const submitter = new MockSubmitter(allowSubmit, setSubmission);
    const config: Accessor<EditorConfig> = createMemo(() => {
        return { bodyPlaceholder: "write a post..." };
    });
    return (
        <>
            <div class="pbCard p-3 m-4">
                <h1>dev tools: editor testing harness</h1>
                <p>
                    this editor is not attached to a client; it's used for
                    testing out different editor states
                </p>
            </div>
            <div class="pbCard p-3 m-4">
                <EditorComponent
                    model={model}
                    validator={validator}
                    submitter={submitter}
                    config={config()}
                ></EditorComponent>
            </div>
            <div class="pbCard p-3 m-4">
                <h1>Uncheck to cause failures at the corresponding stage</h1>
                <ul>
                    <li>
                        <Checkbox
                            id="val"
                            setter={setAllowValidation}
                            getter={allowValidation}
                        >
                            Post passes validation
                        </Checkbox>
                    </li>
                    <li>
                        <Checkbox
                            id="sub"
                            setter={setAllowSubmit}
                            getter={allowSubmit}
                        >
                            Post submits successfully
                        </Checkbox>
                    </li>
                </ul>
            </div>
            <div class="pbCard p-3 m-4">
                <h1>document model</h1>
                <p>
                    current stage: {model.stage}
                    <Show when={model.stage !== "idle"}>
                        <Button
                            onClick={() => model.setStage("idle")}
                            class="mb-6"
                        >
                            reset to idle
                        </Button>
                    </Show>
                </p>

                <RawDataViewer data={model.document} show={true} />
                <h2>validation errors</h2>
                <RawDataViewer data={model.validationErrors} show={true} />
            </div>
            <div class="pbCard p-3 m-4">
                <h1>submitted document</h1>
                <RawDataViewer data={submission} show={true} />
            </div>
        </>
    );
};

class MockValidator extends EditorValidator {
    public constructor(public readonly allow: Accessor<boolean>) {
        super();
    }

    public async validate(doc: EditorDocument): Promise<ValidationError[]> {
        const errs = await super.validate(doc);

        await sleep(1000);
        if (!this.allow()) {
            errs.push(
                new ValidationError(
                    "Blocked because MockValidator 'allow' isn't set to true."
                )
            );
        }

        return errs;
    }
}

class MockSubmitter extends EditorSubmitter {
    public constructor(
        public readonly allow: Accessor<boolean>,
        public readonly setSubmission: Setter<EditorDocument | undefined>
    ) {
        super();
    }

    public async submit(doc: EditorDocument): Promise<ValidationError[]> {
        const errs = [];
        await sleep(1000);
        if (!this.allow()) {
            errs.push(
                new ValidationError(
                    "Blocked because MockSubmitter 'allow' isn't set to true."
                )
            );
        }

        if (errs.length === 0) {
            this.setSubmission(doc);
        }

        return errs;
    }
}

const Checkbox: Component<{
    id: string;
    getter: Accessor<boolean>;
    setter: Setter<boolean>;
    children: JSX.Element;
}> = (props) => {
    const checkboxId = `checkbox-${props.id}`;

    return (
        <>
            <input
                type="checkbox"
                id={checkboxId}
                checked={props.getter()}
                onChange={(e) => props.setter(e.currentTarget.checked)}
            />
            <label for={checkboxId} class="pl-2 select-none">
                {props.children}
            </label>
        </>
    );
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default DevEditDialogPage;
