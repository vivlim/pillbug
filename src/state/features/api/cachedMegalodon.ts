import { MegalodonInterface } from "megalodon";
import { logger } from "~/logging"
import { store } from "~/state/store";
import { apiSlice, DetouredMegalodonCall, MegalodonCachedMethods, MegalodonCachedMethodsType, } from "./apiSlice";

export function CreateCachedMegalodon(megalodon: MegalodonInterface) {
    return new Proxy(megalodon, {
        get(target, p, receiver) {
            const propertyName = String(p) as keyof MegalodonInterface;
            // Check if it is actually one of the cached methods.
            if (MegalodonCachedMethods.includes(propertyName as MegalodonCachedMethodsType)) {
                const targetMethod = (target as any)[propertyName];
                if (typeof targetMethod === "function") {
                    logger.debug("Using detoured megalodon cache for method", propertyName)
                    return async function (...args: any[]) {
                        const detouredCall: DetouredMegalodonCall = {
                            _method: propertyName as MegalodonCachedMethodsType,
                            args,
                            extraTags: []
                        }
                        const result = await store.dispatch(apiSlice.endpoints.megalodon.initiate(detouredCall))
                        // logger.debug(`Detoured result for ${propertyName}`, result)
                        return result.data
                    }
                }
                throw new Error(`Unimplemented cached megalodon property ${String(p)}`)
            }
            else {
                // Non-cached methods
                logger.debug("Directly calling megalodon method", propertyName)
                return target[propertyName];
            }

        },
    })
}