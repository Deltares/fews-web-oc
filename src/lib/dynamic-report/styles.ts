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
  transform?: (css: string[]) => string[],
): Promise<CSSStyleSheet[]> {
  const loaded = (await Promise.all(styles.map(loadStyle))).filter(
    (style) => style !== undefined,
  )
  const css = transform
    ? transform(loaded.map((style) => style.css))
    : undefined
  return loaded.map((style, index) =>
    createScopedStyleSheet(
      css ? css[index] : style.css,
      StyleSheet,
      style.baseURL,
      scoped,
    ),
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
