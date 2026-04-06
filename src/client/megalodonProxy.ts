import { MegalodonInterface } from "megalodon";
import { logger } from "~/logging"
import { ProgressAnimationHandle } from "~/progressAnimation";

export function WrappedMegalodon(megalodon: MegalodonInterface) {
    return new Proxy(megalodon, {
        get(target, p, receiver) {
            const propertyName = String(p) as keyof MegalodonInterface;
            logger.debug("Directly calling megalodon method", propertyName)
            return async function (...args: any[]){
                const anim = new ProgressAnimationHandle(propertyName);
                try {
                    return await target[propertyName](...args);
                }
                finally {
                    anim.finish();
                }
            };
        },
    })
}