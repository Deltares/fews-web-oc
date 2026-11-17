// FNV-1a hash, returned as an unsigned 32-bit hex string.
export function hashString(value: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.codePointAt(i) ?? 0
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16)
}
