import { SessionAuthManager } from "~/auth/auth-manager";
import { EditorActions, EditorAttachment, IEditorSubmitter, ValidationError } from "./editor-types";
import { MegalodonPostStatus } from "./megalodon-status-transformer";
import { MegalodonInterface } from "megalodon";
import { unwrapResponse } from "~/lib/clientUtil";
import { Attachment } from "megalodon/lib/src/entities/attachment";
import { AsyncAttachment } from "megalodon/lib/src/entities/async_attachment";

export class MegalodonPostSubmitter implements IEditorSubmitter<MegalodonPostStatus, string> {

    constructor(private client: MegalodonInterface) {

    }

    async submit(doc: MegalodonPostStatus, attachments: EditorAttachment[], action: EditorActions): Promise<string> {
        // upload attachments
        const media: (Attachment | AsyncAttachment)[] = [];
        const client = this.client;
        for (let attachment of attachments) {
            // not bothering with focus for now
            console.log(`Uploading ${attachment.name}.`)
            const upload = unwrapResponse(await client.uploadMedia(attachment.file, { description: attachment.description }))
            console.log(`Uploaded ${attachment.name}.`)
            media.push(upload)
        }
        doc.options.media_ids = media.map(m => m.id)
        const data = await this.client.postStatus(doc.status, doc.options);
        const newStatus = unwrapResponse(data);
        return newStatus.id
    }
}