export function toCharacterIcon(title: string) {
  const firstCharacter = title.trim().toLowerCase().charAt(0)
  return `mdi-alpha-${firstCharacter}-circle-outline`
}
