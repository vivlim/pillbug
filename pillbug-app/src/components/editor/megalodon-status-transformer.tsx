import { Status } from "megalodon/lib/src/entities/status";
import {
    EditorDocument,
    EditorTransformerBase,
    ValidationError,
} from "./editor-types";
import { Entity } from "megalodon";
import { SessionAuthManager } from "~/auth/auth-manager";

/** This type is copied from megalodon.d.ts MegalodonInterface.postStatus; it's not a named type, so I can't reference it. */
export type MegalodonPostStatusOptions = {
    media_ids?: Array<string>;
    poll?: {
        options: Array<string>;
        expires_in: number;
        multiple?: boolean;
        hide_totals?: boolean;
    };
    in_reply_to_id?: string;
    sensitive?: boolean;
    spoiler_text?: string;
    visibility?: Entity.StatusVisibility;
    scheduled_at?: string;
    language?: string;
    quote_id?: string;
};

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
        return { newStatus: doc.body, extra: undefined };
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
