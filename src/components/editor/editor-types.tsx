import { Entity } from "megalodon";
import { Status } from "megalodon/lib/src/entities/status";
import {
    Accessor,
    ComponentProps,
    createSignal,
    Setter,
    Signal,
} from "solid-js";
import { SetStoreFunction } from "solid-js/store";
import { PersistentStoreBacked, StoreBacked } from "~/lib/store-backed";

export interface NewCommentEditorProps {
    parentStatus: Status;
}

export interface EditorDocument {
    cwVisible: boolean;
    cwContent: string;
    body: string;
    visibility: Entity.StatusVisibility;
    attachments: EditorAttachment[];
}

export interface EditorCommentDocument extends EditorDocument {
    tagRepliedAuthor: boolean;
    replyingTo: Status;
}

export interface EditorAttachment {
    name: string;
    type: string;
    size: number;
    file: File;
    description?: string;
    focus?: { x: number; y: number };
}

type EditorDocumentPropertyNames = keyof EditorDocument;
type ArrayProperties<T> = {
    [P in keyof T as T[P] extends (infer _)[] ? P : never]: T[P];
};
type ArrayItemProperties<T> = {
    [P in keyof T as T[P] extends (infer _)[]
        ? P
        : never]: T[P] extends (infer T2)[] ? T2 : never;
};
type EditorDocumentArrayPropertyNames = keyof ArrayProperties<EditorDocument>;

type EditorStage = "idle" | "validating" | "submitting" | "submitted";

export class EditorDocumentModel<
    TDoc extends EditorDocument
> extends StoreBacked<TDoc> {
    /** Whether the editor document has been submitted by the user. */
    private readonly stageSignal: Signal<EditorStage>;
    private readonly validationErrorsSignal: Signal<ValidationError[]>;

    constructor(doc: TDoc) {
        super(doc);
        this.stageSignal = createSignal<EditorStage>("idle");
        this.validationErrorsSignal = createSignal<ValidationError[]>([]);
    }

    public get document(): TDoc {
        return this.store;
    }

    /** Set a property on the document by key */
    public set<K extends EditorDocumentPropertyNames>(
        key: K,
        value: EditorDocument[K]
    ) {
        // I don't know why this type assertion is necessary, but the type definition for SetStoreFunction does not like having a generic type passed in
        (this.setStore as SetStoreFunction<EditorDocument>)(key, value);
    }

    /*
    // i tried pretty hard but this isn't working so just make setAttachment :'(
    public setArray<
        K extends EditorDocumentArrayPropertyNames,
        V extends ArrayItemProperties<EditorDocument>
    >(key: K, index: number, value: V[K]) {
        this.setStore(key, index, value);
    }
    */

    public setAttachment(
        index: number,
        value: EditorAttachment | ((e: EditorAttachment) => EditorAttachment)
    ) {
        // I don't know why this type assertion is necessary, but the type definition for SetStoreFunction does not like having a generic type passed in
        (this.setStore as SetStoreFunction<EditorDocument>)(
            "attachments",
            index,
            value
        );
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

export abstract class EditorTransformerBase<TDoc extends EditorDocument, T>
    implements IEditorTransformer<TDoc, T>
{
    /** Validate that the document is OK to attempt posting. Override to add additional checks. */
    public async validateAndTransform(
        doc: TDoc
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

    protected async validate(doc: TDoc): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        if (doc.body.length === 0) {
            errors.push(new ValidationError("No post body provided"));
        }

        return errors;
    }

    protected abstract transform(doc: TDoc): Promise<T>;
}

export interface IEditorTransformer<TDoc extends EditorDocument, T> {
    validateAndTransform(
        doc: TDoc
    ): Promise<{ output: T | undefined; errors: ValidationError[] }>;
}

export interface IEditorSubmitter<T, TRet> {
    submit(
        transformedDoc: T,
        attachment: EditorAttachment[],
        action: EditorActions
    ): Promise<TRet>;
}

/** Possible actions, like "submit" and "preview" */
export type EditorActions = "submit";

export class ValidationError {
    constructor(public message: string) {}
}

export interface EditorConfig {
    bodyPlaceholder: string;
}

export interface EditorProps<TPost, TRet, TDoc extends EditorDocument> {
    model: EditorDocumentModel<TDoc>;
    transformer: IEditorTransformer<TDoc, TPost>;
    submitter: IEditorSubmitter<TPost, TRet>;
    config: EditorConfig;
    class?: string | undefined;
    setNewPostId: Setter<TRet | undefined>;
}
