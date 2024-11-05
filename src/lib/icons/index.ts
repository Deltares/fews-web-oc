/**
 * Checks if the given character is a digit (0-9).
 *
 * @param char - The character to check.
 * @returns True if the character is a digit, false otherwise.
 */
function isDigit(char: string) {
  return /^[0-9]$/.test(char)
}

/**
 * Converts the first character of the given title to a corresponding Material Design Icon class.
 * If the first character is a digit, it returns a numeric box outline icon.
 * If the first character is a letter, it returns an alpha circle outline icon.
 *
 * @param title - The title from which to extract the first character.
 * @returns The corresponding Material Design Icon class.
 */
export function toCharacterIcon(title: string, postfix: string = '') {
  const firstCharacter = title.trim().toLowerCase().charAt(0)
  if (isDigit(firstCharacter)) {
    return `mdi-numeric-${firstCharacter}${postfix}`
  }
  return `mdi-alpha-${firstCharacter}${postfix}`
}
