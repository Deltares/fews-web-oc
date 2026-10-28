import DOMPurify from 'dompurify'

export const DYNAMIC_REPORT_SCOPE = '.dynamic-report'

export type DynamicReportStyle =
  /** CSS of a <style> element */
  | { type: 'inline'; css: string }
  /** Path of a <link rel="stylesheet"> in the FEWS static resources */
  | { type: 'resource'; resource: string }

/**
 * How the report is styled, set in the report template with
 * <meta name="weboc-styling" content="isolated">:
 * - weboc: the WebOC styles apply to the report (default)
 * - isolated: only the report styles apply to the report
 */
export type DynamicReportStyling = 'weboc' | 'isolated'

export interface SanitizedDynamicReport {
  /** Report content without <style> and <link> elements */
  fragment: DocumentFragment
  /** Style sheets of the report in document order */
  styles: DynamicReportStyle[]
  styling: DynamicReportStyling
}

/**
 * Sanitize the dynamic report HTML and extract its style sheets.
 *
 * The style sheets are returned separately so they can be scoped to the
 * report container and applied with constructable style sheets, which are
 * allowed by a strict style-src CSP, unlike inline <style> elements.
 */
export function sanitizeDynamicReport(html: string): SanitizedDynamicReport {
  // The styles and the styling option are read from an inert document, which
  // does not load style sheets or run scripts. DOMPurify never returns
  // <style> and <link> elements, so they cannot end up in the WebOC.
  const document = new DOMParser().parseFromString(html, 'text/html')
  const fragment = DOMPurify.sanitize(document.body, {
    FORBID_TAGS: ['style', 'link'],
    RETURN_DOM_FRAGMENT: true,
  })
  return {
    fragment,
    styles: getStyles(document),
    styling: getStyling(document),
  }
}

function getStyles(document: Document): DynamicReportStyle[] {
  const styles: DynamicReportStyle[] = []
  document.querySelectorAll('style, link').forEach((element) => {
    if (element instanceof HTMLStyleElement) {
      styles.push({ type: 'inline', css: element.textContent ?? '' })
    } else if (isStyleSheetLink(element)) {
      const href = element.getAttribute('href') ?? ''
      const resource = toStaticResourcePath(href)
      if (resource) {
        styles.push({ type: 'resource', resource })
      } else {
        console.warn(
          `Dynamic report style sheet should be a relative path to a FEWS static resource: ${href}`,
        )
      }
    }
  })
  return styles
}

function getStyling(document: Document): DynamicReportStyling {
  const content = document
    .querySelector('meta[name="weboc-styling"]')
    ?.getAttribute('content')
    ?.trim()
    .toLowerCase()
  return content === 'isolated' ? 'isolated' : 'weboc'
}

/**
 * Scope CSS to the report container, so that it does not affect the rest of
 * the WebOC.
 */
export function scopeCss(css: string): string {
  return `@scope (${DYNAMIC_REPORT_SCOPE}) {\n${css}\n}`
}

function isStyleSheetLink(element: Element): boolean {
  return (
    element instanceof HTMLLinkElement &&
    element.rel.toLowerCase().split(/\s+/).includes('stylesheet')
  )
}

/**
 * Convert a relative href to a path in the FEWS static resources, e.g.
 * "./css/report.css" to "css/report.css". Returns undefined for absolute
 * URLs and paths outside the static resources.
 */
export function toStaticResourcePath(href: string): string | undefined {
  const base = 'https://static.invalid/'
  let url: URL
  try {
    url = new URL(href, base)
  } catch {
    return undefined
  }
  if (url.origin !== new URL(base).origin || /^\s*\/\//.test(href)) {
    return undefined
  }
  const path = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  return path || undefined
}
