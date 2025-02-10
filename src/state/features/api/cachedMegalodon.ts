import { MegalodonInterface } from "megalodon";
import { logger } from "~/logging"
import { store } from "~/state/store";
import { apiSlice, DetouredMegalodonCall, MegalodonCachedMethods, MegalodonCachedMethodsType, } from "./apiSlice";
import { SignedInAccount } from "~/auth/auth-types";
import { Instance } from "megalodon/lib/src/entities/instance";
import { Account } from "megalodon/lib/src/entities/account";

export function CreateCachedMegalodon(megalodon: MegalodonInterface, account: Account, instance: Instance) {
    return new Proxy(megalodon, {
        get(target, p, receiver) {
            const propertyName = String(p) as keyof MegalodonInterface;
            // Check if it is actually one of the cached methods.
            if (MegalodonCachedMethods.includes(propertyName as MegalodonCachedMethodsType)) {
                const targetMethod = (target as any)[propertyName];
                if (typeof targetMethod === "function") {
                    logger.debug("Using detoured megalodon cache for method", propertyName)
                    const tags = ['accountSpecific']

                    return async function (...args: any[]) {
                        const detouredCall: DetouredMegalodonCall = {
                            _method: propertyName as MegalodonCachedMethodsType,
                            args,
                            accountId: account.id,
                            instanceUri: instance.uri,
                            extraTags: ['accountSpecific', 'megalodon']
                        }
                        const result = await store.dispatch(apiSlice.endpoints.megalodon.initiate(detouredCall))
                        // logger.debug(`Detoured result for ${propertyName}`, result)
                        return result.data
                    }
                }
                throw new Error(`Unimplemented cached megalodon property ${String(p)}`)
            }
            else if (propertyName as string === 'client') {
                // This is a property.
                return target[propertyName];
            }
            else {
                // Non-cached methods
                logger.debug("Directly calling megalodon method", propertyName)
                return target[propertyName];
            }

        },
    })
}