function skipMatching(text: string, position: number, pattern: RegExp): number {
  while (position < text.length && pattern.test(text[position])) position++
  return position
}

function findValueEnd(text: string, position: number): number {
  const quote = text[position]
  if (quote === '"' || quote === "'") {
    let index = position + 1
    while (index < text.length) {
      if (text[index] === '\\') {
        index += 2
        continue
      }
      if (text[index] === quote) return index + 1
      index++
    }
    return text.length
  }
  return skipMatching(text, position, /[^\s,;]/)
}

function redactAssignments(text: string): string {
  const parts: string[] = []
  let position = 0
  let copiedUntil = 0

  while (position < text.length) {
    if (!/[\w-]/.test(text[position])) {
      position++
      continue
    }

    const keyStart = position
    position = skipMatching(text, position, /[\w-]/)
    const key = text.slice(keyStart, position)
    if (['"', "'"].includes(text[position])) position++
    position = skipMatching(text, position, /\s/)
    if (text[position] !== ':' && text[position] !== '=') continue
    position++
    position = skipMatching(text, position, /\s/)

    const valueStart = position
    position = findValueEnd(text, position)

    if (
      position > valueStart &&
      /(?:password|passwd|secret|token|api[_-]?key|authorization|cookie)$/i.test(
        key,
      )
    ) {
      parts.push(text.slice(copiedUntil, valueStart), '[redacted]')
      copiedUntil = position
    } else {
      position = valueStart
    }
  }

  parts.push(text.slice(copiedUntil))
  return parts.join('')
}

export function redactDiagnosticText(text: string): string {
  const redacted = text
    .replace(/https?:\/\/[^\s<>"']+/gi, (value) => {
      try {
        const url = new URL(value)
        url.username = ''
        url.password = ''
        url.search = ''
        url.hash = ''
        return url.toString()
      } catch {
        return '[redacted URL]'
      }
    })
    .replace(/[?#][^\s<>"']+/g, '[redacted parameters]')
    .replace(/\b(Bearer|Basic)\s+[\w.~+/=-]+/gi, '$1 [redacted]')
  return redactAssignments(redacted).replace(
    /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g,
    '[redacted token]',
  )
}
