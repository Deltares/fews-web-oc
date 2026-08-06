function normalizeBase(str: string): string {
  return str.toLowerCase().replaceAll('.', '_').slice(0, 30)
}

function getTrailingDigitCount(str: string): number {
  let count = 0
  for (let i = str.length - 1; i >= 0; i--) {
    const code = str.codePointAt(i)
    if (code === undefined) break
    if (code < 48 || code > 57) break // not a digit
    count++
  }
  return count
}

/**
 * Compares two identity strings that may differ due to backend constraints.
 *
 * The backend stores identifiers derived from emails but:
 * - truncates them to 30 characters
 * - sometimes replaces dots with underscores
 * - may append numeric suffixes (e.g. "user0") for uniqueness
 * - sometimes uses the email prefix (before @) instead of the full email
 *
 * This function checks if two values represent the same identity by:
 * - normalizing format (case, separators, length)
 * - comparing directly
 * - if needed, ignoring trailing numeric suffixes added by the backend
 * - if one is an email and the other is not, comparing the part before the @
 *
 * @param a - First identity (backend or OIDC/email)
 * @param b - Second identity (backend or OIDC/email)
 * @returns True if both represent the same underlying identity
 */
export function hasEqualIdentity(a: string, b: string): boolean {
  if (a === b) return true

  const normA = normalizeBase(a)
  const normB = normalizeBase(b)

  if (normA === normB) return true

  const digitsA = getTrailingDigitCount(normA)
  const digitsB = getTrailingDigitCount(normB)

  if (digitsA > 0 || digitsB > 0) {
    const baseLenA = normA.length - digitsA
    const baseLenB = normB.length - digitsB

    const compareLen = Math.min(baseLenA, baseLenB)

    return normA.slice(0, compareLen) === normB.slice(0, compareLen)
  }

  const emailA = normA.split('@')[0]
  const emailB = normB.split('@')[0]

  if (emailA && emailB) {
    return emailA === emailB
  }

  return false
}
