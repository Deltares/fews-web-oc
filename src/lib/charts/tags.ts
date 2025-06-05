export interface Tag {
  id: string
  name: string
  disabled: boolean
  legendSvg: string
  tooltip?: string
  interactive: boolean
}

export function getMatchingIndexedString(item: string, text?: string) {
  if (!text) return

  const match = item.match(/\[(\d+)\]/)?.[0]
  if (!match) return

  return text.split('\n').find((line) => line.includes(match))
}
