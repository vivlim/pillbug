import { SessionAuthManager } from "~/auth/auth-manager";
import { EditorActions, IEditorSubmitter, ValidationError } from "./editor-types";
import { MegalodonPostStatus } from "./megalodon-status-transformer";
import { MegalodonInterface } from "megalodon";
import { unwrapResponse } from "~/lib/clientUtil";

export class MegalodonPostSubmitter implements IEditorSubmitter<MegalodonPostStatus, string> {

    constructor(private client: MegalodonInterface) {

    }

    async submit(doc: MegalodonPostStatus, action: EditorActions): Promise<string> {
        const errors: ValidationError[] = []
        const data = await this.client.postStatus(doc.status, doc.options);
        const newStatus = unwrapResponse(data);
        return newStatus.id
    }

}