import { getResourcesStaticUrl } from '@/lib/fews-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { type DynamicReportStyle, scopeCss } from './sanitize'

/**
 * Create scoped constructable style sheets for the report styles. Style
 * sheets from the FEWS static resources are fetched, so authentication
 * headers are added, and use their own URL as base URL for relative url()s.
 */
export async function createDynamicReportStyleSheets(
  styles: DynamicReportStyle[],
  StyleSheet: typeof CSSStyleSheet = CSSStyleSheet,
): Promise<CSSStyleSheet[]> {
  const sheets = await Promise.all(
    styles.map((style) => createStyleSheet(style, StyleSheet)),
  )
  return sheets.filter((sheet) => sheet !== undefined)
}

async function createStyleSheet(
  style: DynamicReportStyle,
  StyleSheet: typeof CSSStyleSheet,
): Promise<CSSStyleSheet | undefined> {
  if (style.type === 'inline') {
    return createScopedStyleSheet(
      style.css,
      StyleSheet,
      getResourcesStaticUrl(''),
    )
  }

  const url = getResourcesStaticUrl(style.resource)
  try {
    const transformRequest = createTransformRequestFn()
    const response = await fetch(await transformRequest(new Request(url)))
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    return createScopedStyleSheet(await response.text(), StyleSheet, url)
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
): CSSStyleSheet {
  const parsed = new StyleSheet({ baseURL })
  parsed.replaceSync(css)
  const rules = resolveCssUrls(
    Array.from(parsed.cssRules, (rule) => rule.cssText).join('\n'),
    baseURL ?? document.baseURI,
  )
  const sheet = new StyleSheet({ baseURL })
  sheet.replaceSync(scopeCss(rules))
  return sheet
}

/**
 * Serializing CSS rules loses their URL base in browsers that ignore the
 * constructable sheet baseURL option. Leave strings and comments untouched.
 */
export function resolveCssUrls(css: string, baseURL: string): string {
  return css.replace(
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/)|\burl\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^)\s]*))\s*\)/gi,
    (
      match: string,
      literal: string | undefined,
      doubleQuoted: string | undefined,
      singleQuoted: string | undefined,
      unquoted: string | undefined,
    ) => {
      if (literal) return match
      const url = (doubleQuoted ?? singleQuoted ?? unquoted ?? '').replace(
        /\\([0-9a-f]{1,6}\s?|[\s\S])/gi,
        (_, escaped: string) =>
          /^[0-9a-f]/i.test(escaped)
            ? String.fromCodePoint(parseInt(escaped.trim(), 16) || 0xfffd)
            : escaped,
      )
      return `url(${JSON.stringify(new URL(url, new URL(baseURL, document.baseURI)).href)})`
    },
  )
}
