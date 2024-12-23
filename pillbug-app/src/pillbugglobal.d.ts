import { MegalodonInterface } from "megalodon"
import { SessionAuthManager } from "./auth/auth-manager"
import { Account } from "megalodon/lib/src/entities/account"
import { SignedInState } from "./auth/auth-types"

declare global {
    interface Window {
        pillbug?: PillbugGlobal

    }

}

declare interface PillbugGlobal {
    auth: SessionAuthManager
    client: MegalodonInterface
    signedInState: SignedInState
}