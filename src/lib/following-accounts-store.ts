import { makePersisted, PersistenceOptions } from "@solid-primitives/storage";
import { createStore, SetStoreFunction } from "solid-js/store";
import { StoreBacked } from "./store-backed";
import { Account } from "megalodon/lib/src/entities/account";
import { Status } from "megalodon/lib/src/entities/status";
import { DateTime } from "luxon";
import { useSessionContext } from "./session-context";
import { PillbugAccount } from "~/auth/auth-types";
import { logger } from "~/logging";

export function useAccountStore(): SeenAccountsStore {
    const sessionContext = useSessionContext();
    const auth = sessionContext.authManager;

    if (auth.assumeSignedIn.account.fullAcct !== sessionContext.seenAccountsStore.viewingAccount) {
        // Reset the seen account store if we've switched accounts.
        if (sessionContext.seenAccountsStore.viewingAccount !== undefined) {
            logger.info(`Resetting seen account store after switching from ${sessionContext.seenAccountsStore.viewingAccount} to ${auth.assumeSignedIn.account.fullAcct}`)
            for (const a of Object.keys(sessionContext.seenAccountsStore.store))
                sessionContext.seenAccountsStore.setStore(a, undefined!)
        }
        sessionContext.seenAccountsStore.viewingAccount = auth.assumeSignedIn.account.fullAcct;
    }

    return sessionContext.seenAccountsStore;
}

export interface SeenAccountInfo {
    acct: string;
    account: Account;
    lastKnownStatus: Status | undefined;
    lastKnownStatusTs: DateTime;
    lastKnownStatusUnixTs: number;
    isFollowed: boolean | undefined;
}
export class SeenAccountsStore extends StoreBacked<Record<string, SeenAccountInfo>> {
    public viewingAccount?: string | undefined;
}