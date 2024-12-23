import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
export function prefersReducedMotion(): boolean {
    return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;
} 
export async function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
    }
    else {
        prompt("unable to access the clipboard. please copy this manually:", text)
    }
}

export class Lazy<T> {
    private constructedValue: T | null = null;
    private error: Error | unknown | null = null;

    public constructor(private factory: () => T) {
    }

    public get value(): T {
        if (this.constructedValue !== null) {
            return this.constructedValue;
        }

        if (this.error !== null) {
            throw this.error;
        }

        try {
            this.constructedValue = this.factory();
            return this.constructedValue;
        }
        catch (e) {
            this.error = e;
            throw e;
        }
    }

}