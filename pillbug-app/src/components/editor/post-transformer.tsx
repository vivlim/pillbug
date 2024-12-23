import { SessionAuthManager } from "~/auth/auth-manager";
import { EditorDocument } from "./editor-types";
import { MegalodonEditorTransformer } from "./megalodon-status-transformer";

/** Megalodon status transformer for an ordinary post. It does nothing special currently */
export class PostTransformer extends MegalodonEditorTransformer<
    EditorDocument,
    {}
> {
    constructor(auth: SessionAuthManager) {
        super(auth);
    }
}
