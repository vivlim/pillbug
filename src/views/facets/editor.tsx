import { DateTime } from "luxon";
import {
    Accessor,
    Component,
    createEffect,
    createMemo,
    createResource,
    createSignal,
    For,
    JSX,
    Resource,
    Setter,
    Show,
    Suspense,
} from "solid-js";
import { Timestamp } from "~/components/post/timestamp";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { PersistentFlagNames, useSettings } from "~/lib/settings-manager";
import PostEditor from "../editdialog";
import {
    EditorConfig,
    EditorDocument,
    EditorDocumentModel,
    IEditorSubmitter,
    IEditorTransformer,
} from "~/components/editor/editor-types";
import { ShareTransformer } from "~/components/editor/share-transformer";
import { MegalodonPostStatus } from "~/components/editor/megalodon-status-transformer";
import { PostTransformer } from "~/components/editor/post-transformer";
import { useAuth } from "~/auth/auth-manager";
import { MegalodonPostSubmitter } from "~/components/editor/megalodon-status-submitter";
import { MegalodonStatusEditorComponent } from "~/components/editor/component";
import { TrackedBlockingLoadComponent } from "~/components/tracked-blocking-load";
import { BlockingLoadProgressTracker } from "~/lib/blocking-load";
import { useNavigate, useParams } from "@solidjs/router";
import { PostWithShared } from "~/components/post";
import { PostPageContext, PostPageForId } from "../postpage";

export type EditorFacetProps = {
    sharing_post_id?: string | undefined;
    setNewPostId: Setter<string | undefined>;
};

const EditorFacet: Component = () => {
    const params = useParams();
    const postId: string | undefined = params.shareTarget;

    const [newPostId, setNewPostId] = createSignal<string | undefined>();
    const navigate = useNavigate();

    createEffect(() => {
        if (newPostId() !== undefined) {
            console.log(`Navigating to new post ${newPostId()}`);
            navigate(`/post/${newPostId()}`);
        }
    });
    return (
        <div id="editorRoot">
            <Show when={postId !== undefined}>
                <div id="editorShareTarget" class="pbCard">
                    NOTE: this doesn't actually share the post yet
                    <h1 class="px-4">you're sharing this post:</h1>
                    <PostPageForId postId={postId} shareEditorMode={true} />
                </div>
            </Show>
            <div id="editorEditor">
                <EditorFacetEditor
                    setNewPostId={setNewPostId}
                    sharing_post_id={postId}
                />
            </div>
        </div>
    );
};

const EditorFacetEditor: Component<EditorFacetProps> = (props) => {
    const settings = useSettings();
    const auth = useAuth();
    const [time, setTime] = createSignal(DateTime.now());
    setInterval(() => {
        setTime(DateTime.now());
    }, 5000);

    const [editorModel] = createResource<EditorDocumentModel>(async () => {
        const initialDoc: EditorDocument = {
            body: "",
            cwContent: "",
            cwVisible: false,
            visibility: "unlisted",
        };

        if (props.sharing_post_id !== undefined) {
            // TODO: grab visiblity and cw info from the post and use them in the initial model.
        }

        return new EditorDocumentModel(initialDoc);
    });

    const transformer: Accessor<IEditorTransformer<MegalodonPostStatus>> =
        createMemo(() => {
            if (props.sharing_post_id !== undefined) {
                return new ShareTransformer(props.sharing_post_id);
            } else {
                return new PostTransformer();
            }
        });

    const submitter: Accessor<IEditorSubmitter<MegalodonPostStatus, string>> =
        createMemo(() => {
            const client = auth.assumeSignedIn.client;

            return new MegalodonPostSubmitter(client);
        });

    const config: Accessor<EditorConfig> = createMemo(() => {
        return { bodyPlaceholder: "write a post..." };
    });

    // We don't want to start creating the editor component until the model has been created. This will block it.
    const blockingLoadProgressTracker = new BlockingLoadProgressTracker([]);
    blockingLoadProgressTracker.pushNewResourceOperation(
        "setting up editor data model",
        "createEditorModel",
        editorModel
    );

    return (
        <>
            <TrackedBlockingLoadComponent tracker={blockingLoadProgressTracker}>
                <MegalodonStatusEditorComponent
                    model={editorModel()!}
                    transformer={transformer()}
                    submitter={submitter()}
                    config={config()}
                    setNewPostId={props.setNewPostId}
                    class="h-full p-2"
                ></MegalodonStatusEditorComponent>
            </TrackedBlockingLoadComponent>
        </>
    );
};

export default EditorFacet;
