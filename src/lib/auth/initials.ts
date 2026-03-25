
/**
 * Extracts initials from a name by finding uppercase characters.
 * @param givenName - The name to extract initials from
 * @returns A string containing up to 2 uppercase characters found in the name
 * @example
 * initialsFromName("JohnDoe") // Returns "JD"
 * initialsFromName("john") // Returns ""
 */
export function initialsFromName(givenName: string): string {
  let initialsString = ''
  for (const character of givenName) {
    if (character !== character.toLowerCase()) {
      initialsString = initialsString + character
    }
    if (initialsString.length === 2) return initialsString
  }
  return initialsString
}

/**
 * Extracts initials from a preferred username by taking the first character
 * and the character after the first separator found.
 * @param givenName - The preferred username to extract initials from
 * @returns A string containing up to 2 characters representing the initials
 * @example
 * initialsFromPreferredUserName("john.doe") // Returns "jd"
 * initialsFromPreferredUserName("john") // Returns "jo"
 * initialsFromPreferredUserName("j") // Returns "j"
 */
export function initialsFromPreferredUserName(givenName: string): string {
  if (!givenName) return ''

  const firstChar = givenName.charAt(0)
  const separators = ['.', ',', '_', '-', ' ']

  for (const sep of separators) {
    const idx = givenName.indexOf(sep)
    if (idx !== -1 && idx + 1 < givenName.length) {
      return firstChar + givenName.charAt(idx + 1)
    }
  }

  return givenName.length >= 2 ? givenName.substring(0, 2) : firstChar
}
