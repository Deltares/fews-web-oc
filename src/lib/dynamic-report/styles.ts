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
): Promise<CSSStyleSheet[]> {
  const sheets = await Promise.all(styles.map(createStyleSheet))
  return sheets.filter((sheet) => sheet !== undefined)
}

async function createStyleSheet(
  style: DynamicReportStyle,
): Promise<CSSStyleSheet | undefined> {
  if (style.type === 'inline') {
    return createScopedStyleSheet(style.css)
  }

  const url = getResourcesStaticUrl(style.resource)
  try {
    const transformRequest = createTransformRequestFn()
    const response = await fetch(await transformRequest(new Request(url)))
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    return createScopedStyleSheet(await response.text(), url)
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
function createScopedStyleSheet(css: string, baseURL?: string): CSSStyleSheet {
  const parsed = new CSSStyleSheet({ baseURL })
  parsed.replaceSync(css)
  const rules = Array.from(parsed.cssRules, (rule) => rule.cssText).join('\n')
  const sheet = new CSSStyleSheet({ baseURL })
  sheet.replaceSync(scopeCss(rules))
  return sheet
}
