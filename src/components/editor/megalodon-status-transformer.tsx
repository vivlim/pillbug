import { MegalodonInterface } from "megalodon";
import { SessionAuthManager } from "~/auth/auth-manager";
import {
    EditorDocument,
    EditorTransformerBase,
    ValidationError,
} from "./editor-types";

/**
 * Represents the options you can pass to `MegalodonInterface.postStatus`.
 * This is not a named type upstream, so we're pulling it directly from that method signature.
 */
export type MegalodonPostStatusOptions = Required<
    Parameters<MegalodonInterface["postStatus"]>
>[1];

export type MegalodonPostStatus = {
    status: string;
    options: MegalodonPostStatusOptions;
};

export class MegalodonEditorTransformer<
    TDoc extends EditorDocument,
    TPreTransform
> extends EditorTransformerBase<TDoc, MegalodonPostStatus> {
    constructor(protected auth: SessionAuthManager) {
        super();
    }

    protected async validate(doc: TDoc): Promise<ValidationError[]> {
        const errors = await super.validate(doc);
        // do extra validation needed for megalodon statuses

        return errors;
    }
    protected async transform(doc: TDoc): Promise<MegalodonPostStatus> {
        const preTransform = await this.preTransform(doc);

        const output: MegalodonPostStatus = {
            status: preTransform.newStatus,
            options: {
                visibility: doc.visibility,
                sensitive: doc.cwContent ? true : false,
                spoiler_text: doc.cwContent,
            },
        };

        const withPostTransformApplied = await this.postTransform(
            doc,
            output,
            preTransform.extra
        );
        return withPostTransformApplied;
    }

    /** Optionally rewrite the status body and produce an object to be passed to postTransform */
    protected async preTransform(
        doc: TDoc
    ): Promise<{ newStatus: string; extra: TPreTransform | undefined }> {
        return {
            // This replicates the "markdown hack" currently used in website league akkoma.
            // Ideally, we could pass the tags as their own API field, instead?
            newStatus:
                doc.tags.length > 0
                    ? doc.body + "\n---\n" + doc.tags.join(" ")
                    : doc.body,
            extra: undefined,
        };
    }

    /** By default this has no effect, but derived classes may use it do to things like add reply ids */
    protected async postTransform(
        doc: TDoc,
        status: MegalodonPostStatus,
        preTransform: TPreTransform | undefined
    ): Promise<MegalodonPostStatus> {
        return status;
    }
}
