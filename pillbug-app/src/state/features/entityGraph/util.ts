import { FilterPropertiesByType } from "~/lib/settings-manager"

export type StringProperties<T> = FilterPropertiesByType<T, string>;
export type PropertyDenormalizer<TState, TDenormalized> = (state: TState, id: string) => TDenormalized;

export type StringPropertiesWithDenormalizer<TState, TNormalized, TDenormalized> = {
    [Property in keyof StringProperties<TNormalized>]: PropertyDenormalizer<TState, TDenormalized[Property]>
}

export type DenormalizationSchema<TState, TNormalized, TDenormalized, K extends keyof StringPropertiesWithDenormalizer<TState, TNormalized, TDenormalized>> = Pick<StringPropertiesWithDenormalizer<TState, TNormalized, TDenormalized>, K>;



/*
export interface DenormalizationSchema<TState, TNormalized, TDenormalized> extends Record<keyof StringProperties<TNormalized>, {
    selector: (state: TState, key: string) => TDenormalized[]

}> { }
    */

export function denormalizeProperties<TState, TNormalized, TDenormalized, K extends keyof StringPropertiesWithDenormalizer<TState, TNormalized, TDenormalized>>(state: TState, input: TNormalized, schema: DenormalizationSchema<TState, TNormalized, TDenormalized, K>): TDenormalized {

    const otherProps = {}

}