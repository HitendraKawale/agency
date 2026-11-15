import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CSSProperties } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Inline CSS custom properties, typed: `style={vars({ "--a": 5.71 })}`. */
export function vars(v: Record<`--${string}`, string | number>, rest?: CSSProperties): CSSProperties {
  return { ...v, ...rest } as CSSProperties
}
