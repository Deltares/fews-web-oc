export function documentHeadElements(
  stylesheetUrl: string,
  onStylesheetLoadMessage?: string,
): (HTMLMetaElement | HTMLLinkElement | HTMLStyleElement)[] {
  const children = []
  const metaCharsetElement = document.createElement('meta')
  metaCharsetElement.setAttribute('charset', 'UTF-8')
  children.push(metaCharsetElement)

  const metaViewportElement = document.createElement('meta')
  metaViewportElement.setAttribute('name', 'viewport')
  metaViewportElement.setAttribute(
    'content',
    'width=device-width,initial-scale=1',
  )
  children.push(metaViewportElement)

  const styleSheetElement = document.createElement('link')
  styleSheetElement.rel = 'stylesheet'
  styleSheetElement.type = 'text/css'
  styleSheetElement.href = stylesheetUrl
  if (onStylesheetLoadMessage) {
    styleSheetElement.addEventListener('load', () => {
      window.parent.postMessage(onStylesheetLoadMessage, '*')
    })
  }
  children.push(styleSheetElement)
  return children
}

export function headString(stylesheetUrl: string): string {
  const headElement = document.createElement('head')
  for (const element of documentHeadElements(stylesheetUrl)) {
    headElement.appendChild(element)
  }
  return headElement.outerHTML
}
