import type { InjectionKey } from 'vue'
import { resolveCSSVariable } from '@/lib/utils/resolveCSSVariable'

export const flagColorResolverKey: InjectionKey<(color: string) => string> =
  Symbol('flagColorResolver')

export function createFlagColorResolver() {
  const values = new Map<string, string>()

  return (color: string): string => {
    if (!values.has(color)) {
      values.set(color, resolveCSSVariable(color).trim())
    }
    return values.get(color)!
  }
}