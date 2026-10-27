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
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(scopeCss(style.css))
    return sheet
  }

  const url = getResourcesStaticUrl(style.resource)
  try {
    const transformRequest = createTransformRequestFn()
    const response = await fetch(await transformRequest(new Request(url)))
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    const sheet = new CSSStyleSheet({ baseURL: url })
    sheet.replaceSync(scopeCss(await response.text()))
    return sheet
  } catch (error) {
    console.error(`Failed to load dynamic report style sheet: ${url}`, error)
    return undefined
  }
}
