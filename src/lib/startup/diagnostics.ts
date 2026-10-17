export function redactDiagnosticText(text: string): string {
  return text
    .replace(/https?:\/\/[^\s<>"']+/gi, (value) => {
      const url = new URL(value)
      url.username = ''
      url.password = ''
      url.search = ''
      url.hash = ''
      return url.toString()
    })
    .replace(/[?#][^\s<>"']+/g, '[redacted parameters]')
    .replace(/\b(Bearer|Basic)\s+[\w.~+/=-]+/gi, '$1 [redacted]')
    .replace(
      /(["']?([\w-]+)["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/g,
      (assignment: string, prefix: string, key: string) =>
        /(?:password|passwd|secret|token|api[_-]?key|authorization|cookie)$/i.test(
          key,
        )
          ? `${prefix}[redacted]`
          : assignment,
    )
    .replace(
      /\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g,
      '[redacted token]',
    )
}
