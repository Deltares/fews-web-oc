import { sanitizeDynamicReport } from './sanitize'
import { createDynamicReportStyleSheets, resolveCssUrls } from './styles'
import { getResourcesStaticUrl } from '@/lib/fews-config'

export async function printDynamicReport(
  html: string,
  title: string,
): Promise<void> {
  const tab = window.open('about:blank', '_blank')
  if (!tab) throw new Error('The browser blocked the report print tab')
  tab.opener = null
  try {
    if (!hasStyleSheetConstructor(tab)) {
      throw new Error('The browser does not support report print styles')
    }
    const report = sanitizeDynamicReport(html)
    // Construct sheets in the print document, retaining each resource's URL base.
    const sheets = await createDynamicReportStyleSheets(
      report.styles,
      tab.CSSStyleSheet,
    )
    if (sheets.length !== report.styles.length) {
      throw new Error('Could not load all report styles for printing')
    }
    if (tab.closed) throw new Error('The report print tab was closed')
    const target = tab.document
    target.title = title
    const base = target.createElement('base')
    base.href = new URL(getResourcesStaticUrl(''), window.location.href).href
    target.head.appendChild(base)
    const container = target.createElement('div')
    container.className = 'dynamic-report'
    container.appendChild(target.importNode(report.fragment, true))
    target.body.replaceChildren(container)
    const defaults: CSSStyleSheet[] = []
    if (report.styling === 'weboc') {
      target.body.className =
        document.querySelector('.v-application')?.className ?? ''
      for (const sheet of [
        ...document.styleSheets,
        ...document.adoptedStyleSheets,
      ]) {
        const style = new tab.CSSStyleSheet({
          baseURL: sheet.href ?? document.baseURI,
        })
        style.replaceSync(
          resolveCssUrls(
            Array.from(sheet.cssRules, (rule) => rule.cssText).join('\n'),
            sheet.href ?? document.baseURI,
          ),
        )
        defaults.push(style)
      }
    }
    target.adoptedStyleSheets = [...defaults, ...sheets]
    container.getBoundingClientRect()
    await Promise.all(Array.from(target.images, (image) => image.decode()))
    await target.fonts.ready
    if (tab.closed) throw new Error('The report print tab was closed')
    tab.focus()
    tab.print()
  } catch (error) {
    tab.close()
    throw error
  }
}

function hasStyleSheetConstructor(
  tab: Window,
): tab is Window & Pick<typeof globalThis, 'CSSStyleSheet'> {
  return 'CSSStyleSheet' in tab && typeof tab.CSSStyleSheet === 'function'
}
