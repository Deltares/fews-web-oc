import { getResourcesStaticUrl } from '@/lib/fews-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { type DynamicReportStyle, scopeCss } from './sanitize'

/**
 * Create constructable style sheets for reports. They are scoped by default;
 * print documents can opt out because they contain only the report. Style
 * sheets from FEWS static resources are fetched with authentication headers
 * and use their own URL as the base for relative url()s.
 */
export async function createDynamicReportStyleSheets(
  styles: DynamicReportStyle[],
  StyleSheet: typeof CSSStyleSheet = CSSStyleSheet,
  scoped = true,
): Promise<CSSStyleSheet[]> {
  const loaded = (await Promise.all(styles.map(loadStyle))).filter(
    (style) => style !== undefined,
  )
  return loaded.map((style) =>
    createScopedStyleSheet(style.css, StyleSheet, style.baseURL, scoped),
  )
}

async function loadStyle(
  style: DynamicReportStyle,
): Promise<{ css: string; baseURL: string } | undefined> {
  if (style.type === 'inline') {
    return { css: style.css, baseURL: getResourcesStaticUrl('') }
  }

  const url = getResourcesStaticUrl(style.resource)
  try {
    const transformRequest = createTransformRequestFn()
    const response = await fetch(await transformRequest(new Request(url)))
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    return { css: await response.text(), baseURL: url }
  } catch (error) {
    console.error(`Failed to load dynamic report style sheet: ${url}`, error)
    return undefined
  }
}

/**
 * Scope the CSS to the report container. The CSS is parsed on its own first
 * and only the complete rules are scoped, so an unbalanced "}" cannot close
 * the scope and style the rest of the WebOC.
 */
function createScopedStyleSheet(
  css: string,
  StyleSheet: typeof CSSStyleSheet,
  baseURL?: string,
  scoped = true,
): CSSStyleSheet {
  const parsed = new StyleSheet({ baseURL })
  parsed.replaceSync(css)
  const rules = resolveCssUrls(
    Array.from(parsed.cssRules, (rule) => rule.cssText).join('\n'),
    baseURL ?? document.baseURI,
  )
  const sheet = new StyleSheet({ baseURL })
  sheet.replaceSync(scoped ? scopeCss(rules) : rules)
  return sheet
}

/**
 * Serializing CSS rules loses their URL base in browsers that ignore the
 * constructable sheet baseURL option. Leave strings and comments untouched.
 */
export function resolveCssUrls(css: string, baseURL: string): string {
  const base = new URL(baseURL, document.baseURI)
  const chunks: string[] = []
  let start = 0
  let index = 0
  while (index < css.length) {
    const end = cssTokenEnd(css, index)
    if (end !== index) {
      index = end
      continue
    }
    const url = readCssUrl(css, index)
    if (url) {
      if (url.value !== undefined) {
        chunks.push(
          css.slice(start, index),
          `url(${JSON.stringify(new URL(decodeCssUrl(url.value), base).href)})`,
        )
        start = url.end
      }
      index = url.end
    } else {
      index++
    }
  }
  chunks.push(css.slice(start))
  return chunks.join('')
}

function cssTokenEnd(css: string, index: number): number {
  if (css.startsWith('/*', index)) {
    const end = css.indexOf('*/', index + 2)
    return end < 0 ? css.length : end + 2
  }
  if (css[index] === '"' || css[index] === "'") {
    return cssStringEnd(css, index)
  }
  return index
}

function cssStringEnd(css: string, start: number): number {
  let index = start + 1
  while (index < css.length) {
    if (css[index] === css[start]) return index + 1
    index += css[index] === '\\' ? 2 : 1
  }
  return css.length
}

function readCssUrl(
  css: string,
  start: number,
): { value?: string; end: number } | undefined {
  if (css.slice(start, start + 4).toLowerCase() !== 'url(') return undefined
  if (start > 0 && /[\w-]/.test(css[start - 1])) return undefined
  let index = skipCssWhitespace(css, start + 4)
  const quoted = css[index] === '"' || css[index] === "'"
  const valueStart = quoted ? index + 1 : index
  index = quoted ? cssStringEnd(css, index) : cssUnquotedUrlEnd(css, index)
  const value = css.slice(valueStart, quoted ? index - 1 : index)
  index = skipCssWhitespace(css, index)
  return css[index] === ')' ? { value, end: index + 1 } : { end: index }
}

function skipCssWhitespace(css: string, start: number): number {
  let index = start
  while (/\s/.test(css[index] ?? '') && index < css.length) index++
  return index
}

function cssUnquotedUrlEnd(css: string, start: number): number {
  let index = start
  while (index < css.length && css[index] !== ')' && !/\s/.test(css[index])) {
    index += css[index] === '\\' ? 2 : 1
  }
  return index
}

function decodeCssUrl(value: string): string {
  return value.replace(/\\([0-9a-f]{1,6}\s?|[\s\S])/gi, (_, escaped: string) =>
    /^[0-9a-f]/i.test(escaped)
      ? String.fromCodePoint(Number.parseInt(escaped.trim(), 16) || 0xfffd)
      : escaped,
  )
}
