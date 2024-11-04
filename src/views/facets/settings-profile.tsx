import { Account } from "megalodon/lib/src/entities/account";
import {
    Component,
    createMemo,
    createResource,
    Show,
    Suspense,
} from "solid-js";
import { SessionAuthManager, useAuth } from "~/auth/auth-manager";
import {
    PropertyTextboxesBuilder,
    PropertyTextboxesProps,
} from "~/components/textbox";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { unwrapResponse } from "~/lib/clientUtil";
import { StoreBacked } from "~/lib/store-backed";

export const ProfileSettingsComponent: Component = () => {
    const auth = useAuth();
    const [profile, profileAction] = createResource(
        () => auth,
        async (a: SessionAuthManager) => {
            const response =
                await a.assumeSignedIn.client.verifyAccountCredentials();
            return unwrapResponse(response);
        }
    );
    const profilePatch = new StoreBacked<UpdateCredentialsPatch>({});
    const readProfileValue: (
        k: keyof ProfileFields
    ) => ProfileFields[typeof k] = (k) => {
        const current = profile();
        if (current === undefined) {
            throw new Error("not ready to read profile value yet.");
        }
        const editingValue = profilePatch.store[k];
        if (editingValue !== undefined) {
            return editingValue;
        }
        return readAccount(current, k);
    };

    const fields = createMemo<ProfileFields>(() => {
        const current = profile();
        if (current === undefined) {
            return undefined;
        }

        const result: any = {};
        for (const k of FieldKeys) {
            result[k] = readProfileValue(k);
        }
        return result;
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>profile</CardTitle>
            </CardHeader>
            <CardContent>
                <Show when={profile() !== undefined}>
                    <p>{profile()?.acct}</p>
                    <ProfilePropertyBoxes
                        value={fields()}
                        setter={(p) => {
                            for (const kToUpdate of Object.keys(
                                p
                            ) as (keyof ProfileFields)[]) {
                                profilePatch.setStore(kToUpdate, p[kToUpdate]);
                            }
                        }}
                    />
                </Show>
            </CardContent>
        </Card>
    );
};

const ProfilePropertyBoxes: Component<PropertyTextboxesProps<ProfileFields>> = (
    props
) => PropertyTextboxesBuilder<ProfileFields>(props);

interface ProfileFields {
    discoverable: boolean | undefined;
    bot: boolean | null;
    display_name: string;
    note: string;
    avatar: string;
    header: string;
    locked: boolean;
    source: {
        privacy: string | null;
        sensitive: boolean | null;
        language: string | null;
    };
    fields_attributes: Array<{ name: string; value: string }>;
}

const FieldKeys: (keyof ProfileFields)[] = [
    "discoverable",
    "bot",
    "display_name",
    "note",
    "avatar",
    "header",
    "locked",
    "source",
    "fields_attributes",
];

interface UpdateCredentialsPatch extends Partial<ProfileFields> {}

function readAccount(
    account: Account,
    k: keyof ProfileFields
): ProfileFields[typeof k] {
    switch (k) {
        case "discoverable":
            return account.discoverable;
        case "bot":
            return account.bot;
        case "display_name":
            return account.display_name;
        case "note":
            return account.note;
        case "avatar":
            return account.avatar;
        case "header":
            return account.header;
        case "locked":
            return account.locked;
        case "source":
            const s = account.source;
            if (s === undefined) {
                throw new Error("acount source not defined");
            }
            return {
                privacy: s.privacy,
                language: s.language,
                sensitive: s.sensitive,
            };
        case "fields_attributes":
            return account.fields.map((f) => {
                return { name: f.name, value: f.value };
            });
    }
}
