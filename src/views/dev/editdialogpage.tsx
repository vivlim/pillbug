import { DateTime } from "luxon";
import {
    Accessor,
    Component,
    createEffect,
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
import {
    EditorActions,
    EditorConfig,
    EditorDocument,
    EditorDocumentModel,
    EditorProps,
    EditorSubmitter,
    EditorTransformerBase,
    IEditorSubmitter,
    IEditorTransformer,
    ValidationError,
} from "~/components/editor/editor-types";
import { RawDataViewer } from "~/components/raw-data";
import { Button } from "~/components/ui/button";
import {
    MegalodonEditorTransformer,
    MegalodonPostStatus,
} from "~/components/editor/megalodon-status-transformer";
import { MegalodonStatusEditorComponent } from "~/components/editor/component";
import { PostTransformer } from "~/components/editor/post-transformer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CommentTransformer } from "~/components/editor/comment-transformer";
import { ShareTransformer } from "~/components/editor/share-transformer";

type EditorVariant<T> = {
    name: string;
    transformer: MockTransformerWrapper<T>;
    submitter: MockSubmitter;
    component: Component<EditorProps<MegalodonPostStatus>>;
};

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

    const [autoReset, setAutoReset] = createSignal(true);
    const [allowValidation, setAllowValidation] = createSignal(true);
    const [allowSubmit, setAllowSubmit] = createSignal(true);
    const [submission, setSubmission] = createSignal<
        MegalodonPostStatus | undefined
    >(undefined);
    const config: Accessor<EditorConfig> = createMemo(() => {
        return { bodyPlaceholder: "write a post..." };
    });

    const [selectedVariant, setSelectedVariant] = createSignal<string>("post");

    const variants: EditorVariant<any>[] = [
        {
            name: "post",
            transformer: new MockTransformerWrapper(
                new PostTransformer(),
                allowValidation
            ),
            submitter: new MockSubmitter(allowSubmit, setSubmission),
            component: MegalodonStatusEditorComponent,
        },
        {
            name: "comment",
            transformer: new MockTransformerWrapper(
                new CommentTransformer("FAKE_REPLY_TO_ID"),
                allowValidation
            ),
            submitter: new MockSubmitter(allowSubmit, setSubmission),
            component: MegalodonStatusEditorComponent,
        },
        {
            name: "share",
            transformer: new MockTransformerWrapper(
                new ShareTransformer("FAKE_SHARE_TARGET_ID"),
                allowValidation
            ),
            submitter: new MockSubmitter(allowSubmit, setSubmission),
            component: MegalodonStatusEditorComponent,
        },
    ];

    const variantNames = variants.map((variant) => variant.name);

    const activeVariantComponent: Accessor<JSX.Element> = createMemo(() => {
        const selectedName = selectedVariant();
        const variant = variants.filter(
            (variant) => variant.name === selectedName
        )[0];
        const variantComponent = variant.component;
        return variantComponent({
            model: model,
            transformer: variant.transformer,
            submitter: variant.submitter,
            config: config(),
        });
    });

    createEffect(() => {
        if (autoReset() && model.stage === "submitted") {
            model.setStage("idle");
        }
    });

    return (
        <>
            <div class="pbCard p-3 m-4">
                <h1>dev tools: editor testing harness</h1>
                <p>
                    this editor is not attached to a client; it's used for
                    testing out different editor states
                </p>
                <div>
                    editor variant:
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            type="button"
                            class="border-2 p-2 m-1 rounded-md"
                        >
                            {selectedVariant()}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent class="w-48">
                            <DropdownMenuRadioGroup
                                value={selectedVariant()}
                                onChange={(val) => {
                                    setSelectedVariant(val);
                                }}
                            >
                                <DropdownMenuRadioItem value="post">
                                    post
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="comment">
                                    comment
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="share">
                                    share
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div class="pbCard p-3 m-4">{activeVariantComponent()}</div>
            <div class="pbCard p-3 m-4">
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
                <p>
                    <Checkbox id="sub" setter={setAutoReset} getter={autoReset}>
                        Automatically reset to idle state after submitting
                    </Checkbox>
                </p>
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
            <div class="flex flex-row">
                <div class="grow pbCard p-3 m-4">
                    <h1>document model</h1>

                    <RawDataViewer data={model.document} show={true} />
                    <h2>validation errors</h2>
                    <RawDataViewer data={model.validationErrors} show={true} />
                </div>
                <div class="grow pbCard p-3 m-4">
                    <h1>submitted document</h1>
                    <RawDataViewer data={submission()} show={true} />
                </div>
            </div>
        </>
    );
};

class MockTransformerWrapper<T> implements IEditorTransformer<T> {
    public constructor(
        public inner: EditorTransformerBase<T>,
        public readonly allow: Accessor<boolean>
    ) {}

    public async validateAndTransform(
        doc: EditorDocument
    ): Promise<{ output: T | undefined; errors: ValidationError[] }> {
        const output = await this.inner.validateAndTransform(doc);

        await sleep(1000);
        if (!this.allow()) {
            output.errors.push(
                new ValidationError(
                    "Blocked because MockTransformerWrapper 'allow' isn't set to true."
                )
            );
        }

        return output;
    }
}

class MockSubmitter
    extends EditorSubmitter<MegalodonPostStatus>
    implements IEditorSubmitter<MegalodonPostStatus>
{
    public constructor(
        public readonly allow: Accessor<boolean>,
        public readonly setSubmission: Setter<MegalodonPostStatus | undefined>
    ) {
        super();
    }

    public async submit(
        transformedDoc: MegalodonPostStatus,
        action: EditorActions
    ): Promise<ValidationError[]> {
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
            this.setSubmission(transformedDoc);
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
