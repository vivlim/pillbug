import { Entity } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Accessor,
    ComponentProps,
    createSignal,
    Setter,
    Signal,
} from "solid-js";
import { PersistentStoreBacked, StoreBacked } from "~/lib/store-backed";

export interface NewCommentEditorProps {
    parentStatus: Status;
}

export interface EditorDocument {
    cwVisible: boolean;
    cwContent: string;
    body: string;
    visibility: Entity.StatusVisibility;
}

type EditorDocumentPropertyNames = keyof EditorDocument;

type EditorStage = "idle" | "validating" | "submitting" | "submitted";

export class EditorDocumentModel extends StoreBacked<EditorDocument> {
    /** Whether the editor document has been submitted by the user. */
    private readonly stageSignal: Signal<EditorStage>;
    private readonly validationErrorsSignal: Signal<ValidationError[]>;

    constructor(doc: EditorDocument) {
        super(doc);
        this.stageSignal = createSignal<EditorStage>("idle");
        this.validationErrorsSignal = createSignal<ValidationError[]>([]);
    }

    public get document(): EditorDocument {
        return this.store;
    }

    /** Set a property on the document by key */
    public set<K extends EditorDocumentPropertyNames>(
        key: K,
        value: EditorDocument[K]
    ) {
        this.setStore(key, value);
    }

    public get stage(): EditorStage {
        return this.stageSignal[0]();
    }

    public setStage(value: EditorStage) {
        this.stageSignal[1](value);
    }

    public get validationErrors(): ValidationError[] {
        return this.validationErrorsSignal[0]();
    }

    public setValidationErrors(errs: ValidationError[]) {
        this.validationErrorsSignal[1](errs);
    }
}

export abstract class EditorTransformerBase<T>
    implements IEditorTransformer<T>
{
    /** Validate that the document is OK to attempt posting. Override to add additional checks. */
    public async validateAndTransform(
        doc: EditorDocument
    ): Promise<{ output: T | undefined; errors: ValidationError[] }> {
        const errors = await this.validate(doc);
        if (errors.length > 0) {
            return { output: undefined, errors: errors };
        }

        try {
            const result = await this.transform(doc);
            return { output: result, errors: [] };
        } catch (err) {
            if (err instanceof Error) {
                return {
                    output: undefined,
                    errors: [
                        new ValidationError(
                            `Failed to transform document: ${
                                err.stack ?? err.message
                            }`
                        ),
                    ],
                };
            }
            return {
                output: undefined,
                errors: [
                    new ValidationError(
                        "Failed to transform document, and caught an error which wasn't instanceof Error (this is a bug)"
                    ),
                ],
            };
        }
    }

    protected async validate(doc: EditorDocument): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        if (doc.body.length === 0) {
            errors.push(new ValidationError("No post body provided"));
        }

        return errors;
    }

    protected abstract transform(doc: EditorDocument): Promise<T>;
}

export abstract class EditorSubmitter<T> implements IEditorSubmitter<T> {
    public async submit(
        doc: T,
        action: EditorActions
    ): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        return errors;
    }
}
export interface IEditorTransformer<T> {
    validateAndTransform(
        doc: EditorDocument
    ): Promise<{ output: T | undefined; errors: ValidationError[] }>;
}

export interface IEditorSubmitter<T> {
    submit(
        transformedDoc: T,
        action: EditorActions
    ): Promise<ValidationError[]>;
}

/** Possible actions, like "submit" and "preview" */
export type EditorActions = "submit";

export class ValidationError {
    constructor(public message: string) {}
}

export interface EditorConfig {
    bodyPlaceholder: string;
}

export interface EditorProps<T> {
    model: EditorDocumentModel;
    transformer: IEditorTransformer<T>;
    submitter: IEditorSubmitter<T>;
    config: EditorConfig;
    class?: string | undefined;
}
