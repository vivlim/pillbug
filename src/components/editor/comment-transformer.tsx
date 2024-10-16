import { EditorDocument } from "./editor-types";
import {
    MegalodonEditorTransformer,
    MegalodonPostStatus,
} from "./megalodon-status-transformer";

type CommentPreTransform = {};

/** Megalodon status transformer that attaches an in_reply_to_id, for use with comments */
export class CommentTransformer extends MegalodonEditorTransformer<CommentPreTransform> {
    constructor(private inReplyToId: string) {
        super();
    }

    protected override async postTransform(
        doc: EditorDocument,
        status: MegalodonPostStatus,
        preTransform: CommentPreTransform | undefined
    ): Promise<MegalodonPostStatus> {
        status.options.in_reply_to_id = this.inReplyToId;
        return status;
    }
}
