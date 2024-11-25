import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
export function prefersReducedMotion(): boolean {
    return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;
} 