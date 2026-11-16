import { parse, type Node as CssNode, type Rule } from 'postcss'

/**
 * Chromium supports page margin boxes but not CSS named strings. Resolve the
 * first matching report element once, before the browser discards these rules.
 */
export function resolvePrintNamedStrings(
  styles: string[],
  report: DocumentFragment,
): string[] {
  if (!styles.some((css) => /\bstring(?:-set|\s*\()/i.test(css))) return styles

  const roots = styles.map((css) => parse(css))
  const values = new Map<string, { element: Element; text: string }>()
  for (const root of roots) {
    root.walkDecls(/^string-set$/i, (declaration) => {
      const match = /^([a-z_][\w-]*)\s+content\(\s*(?:text\s*)?\)$/i.exec(
        declaration.value.trim(),
      )
      if (!match || declaration.parent?.type !== 'rule') {
        console.warn(`Unsupported print string-set: ${declaration.value}`)
        return
      }
      const selector = nestedSelector(declaration.parent)
      let elements: NodeListOf<Element>
      try {
        elements = report.querySelectorAll(selector)
      } catch {
        console.warn(`Unsupported print string-set selector: ${selector}`)
        return
      }
      for (const element of elements) {
        const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim()
        const previous = values.get(match[1])
        if (previous && previous.text !== text) {
          console.warn(
            `Print named string "${match[1]}" has multiple values; using the first in the report`,
          )
        }
        if (
          !previous ||
          previous.element.compareDocumentPosition(element) &
            Node.DOCUMENT_POSITION_PRECEDING
        ) {
          values.set(match[1], { element, text })
        }
      }
    })
  }

  for (const root of roots) {
    root.walkDecls(/^content$/i, (declaration) => {
      if (!hasPageAncestor(declaration.parent)) return
      declaration.value = (
        declaration.raws.value?.raw ?? declaration.value
      ).replace(
        /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\/\*[\s\S]*?\*\/)|(?<![a-z0-9_\\-])string\(\s*([a-z_][\w-]*)\s*\)/gi,
        (token: string, literal: string | undefined, name: string) => {
          if (literal) return token
          const value = values.get(name)
          if (!value) {
            console.warn(
              `No report element found for print named string "${name}"`,
            )
            return token
          }
          return cssString(value.text)
        },
      )
    })
  }
  return roots.map((root) => root.toString())
}

function nestedSelector(rule: Rule): string {
  let selector = rule.selector
  for (
    let parent: CssNode | undefined = rule.parent;
    parent;
    parent = parent.parent
  ) {
    if (
      parent.type !== 'rule' ||
      !('selector' in parent) ||
      typeof parent.selector !== 'string'
    ) {
      continue
    }
    const ancestor = `:is(${parent.selector})`
    selector = selector.includes('&')
      ? selector.replace(/&/g, ancestor)
      : `${ancestor} :is(${selector})`
  }
  return selector
}

function hasPageAncestor(node: CssNode | undefined): boolean {
  while (node) {
    if (node.type === 'atrule' && 'name' in node && node.name === 'page') {
      return true
    }
    node = node.parent
  }
  return false
}

function cssString(value: string): string {
  return `"${value.replace(/["\\\x00-\x1f\x7f]/g, (character) => {
    if (character === '"' || character === '\\') return `\\${character}`
    return `\\${character.codePointAt(0)?.toString(16)} `
  })}"`
}
