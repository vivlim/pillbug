import { SessionAuthManager } from "~/auth/auth-manager";
import { EditorDocument } from "./editor-types";
import {
    MegalodonEditorTransformer,
    MegalodonPostStatus,
} from "./megalodon-status-transformer";
import { Status } from "megalodon/lib/src/entities/status";

type SharePreTransform = {};

/** Megalodon status transformer for share posts */
export class ShareTransformer extends MegalodonEditorTransformer<
    EditorDocument,
    SharePreTransform
> {
    constructor(private shareTarget: Status, auth: SessionAuthManager) {
        super(auth);
    }

    protected override async postTransform(
        doc: EditorDocument,
        status: MegalodonPostStatus,
        preTransform: SharePreTransform | undefined
    ): Promise<MegalodonPostStatus> {
        status.status = `${status.status}\n\nRE: ${this.shareTarget.uri}`;
        status.options.quote_id = this.shareTarget.id;

        return status;
    }
}
