import { sanitizeDynamicReport } from './sanitize'
import { createDynamicReportStyleSheets, resolveCssUrls } from './styles'
import { resolvePrintNamedStrings } from './printNamedStrings'
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
    const report = sanitizeDynamicReport(html, { includePrintStyles: true })
    // Construct sheets in the print document, retaining each resource's URL base.
    const supportsNamedStrings =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('string-set', 'report-title content(text)') &&
      CSS.supports('content', 'string(report-title)')
    const sheets = await createDynamicReportStyleSheets(
      report.styles,
      tab.CSSStyleSheet,
      false,
      supportsNamedStrings
        ? undefined
        : (styles) => resolvePrintNamedStrings(styles, report.fragment),
    )
    if (sheets.length !== report.styles.length) {
      throw new Error('Could not load all report styles for printing')
    }
    if (tab.closed) throw new Error('The report print tab was closed')
    const target = tab.document
    target.title =
      new DOMParser().parseFromString(html, 'text/html').title || title
    const base = target.createElement('base')
    base.href = new URL(getResourcesStaticUrl(''), window.location.href).href
    target.head.appendChild(base)
    const container = target.createElement('div')
    container.className = 'dynamic-report'
    container.appendChild(target.importNode(report.fragment, true))
    target.body.replaceChildren(container)
    const defaults: CSSStyleSheet[] = []
    if (report.styling === 'weboc') {
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
    if (report.styling === 'weboc') {
      const reportFontElement =
        container.querySelector('.report-body, .report-header') ??
        container.firstElementChild ??
        container
      const fontStyle = target.createElement('span').style
      fontStyle.fontFamily = tab.getComputedStyle(reportFontElement).fontFamily
      const fontFamily = fontStyle.fontFamily || 'sans-serif'
      const printSheet = new tab.CSSStyleSheet()
      printSheet.replaceSync(createPrintCss(target.title, fontFamily))
      target.adoptedStyleSheets = [printSheet, ...target.adoptedStyleSheets]
    }
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

export function createPrintCss(
  title: string,
  fontFamily = 'sans-serif',
): string {
  return `
html, body {
  display: block !important;
  position: static !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: visible !important;
}
@media print {
  @page {
    margin: 20mm 0;
    @top-center {
      content: ${JSON.stringify(title.replace(/\s+/g, ' ').trim())};
      font-family: ${fontFamily};
      font-size: 10pt;
    }
    @bottom-center {
      content: "Page " counter(page) " out of " counter(pages);
      font-family: ${fontFamily};
      font-size: 10pt;
    }
  }
  @page :first {
    margin-top: 0;
    @top-center {
      content: none;
    }
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
  }
  .dynamic-report,
  .dynamic-report :is(div, section, article, main, header, footer) {
    display: block !important;
    position: static !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    contain: none !important;
  }
  .dynamic-report * {
    overflow: visible !important;
    max-height: none !important;
  }
  .dynamic-report img, .dynamic-report tr {
    break-inside: avoid;
  }
}`
}

function hasStyleSheetConstructor(
  tab: Window,
): tab is Window & Pick<typeof globalThis, 'CSSStyleSheet'> {
  return 'CSSStyleSheet' in tab && typeof tab.CSSStyleSheet === 'function'
}
