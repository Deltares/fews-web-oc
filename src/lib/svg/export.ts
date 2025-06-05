/** Clones an SVG element and embed CSS.

 *
 * To make an SVG element exportable, we need to embed CSS into an internal
 * <style> element, because we cannot refer to external style sheets when e.g.
 * using the SVG as a source for an <img> tag.
 */
export function createExportableSvgElement(
  svg: SVGSVGElement,
  cssContents: string,
): SVGSVGElement {
  const exportSvg = svg.cloneNode(true) as SVGSVGElement

  const style = document.createElement('style')
  style.textContent = cssContents
  exportSvg.insertBefore(style, exportSvg.firstChild)

  return exportSvg
}

export function convertSvgElementToDataUrl(
  svg: SVGSVGElement,
  width: number,
  height: number,
): string {
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement

  // Make sure the width and height of the SVG is set such that it will have an
  // appropriate naturalWidth and naturalHeight. Otherwise, it will be rendered
  // in much lower resolutions in HTML image elements, even though the width and
  // height of the image element are set.
  clonedSvg.setAttribute('width', width.toString())
  clonedSvg.setAttribute('height', height.toString())

  // First, serialise the SVG element to a string.
  const serializer = new XMLSerializer()
  const svgText = serializer.serializeToString(clonedSvg)

  // Then convert the string to base64. Note that this is not trivial for
  // general UTF-8 text such as our SVG element, because the btoa() function is
  // ancient and does not have UTF-8 support; it only supports code points up to
  // 0xff. Refer to
  //
  // https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
  //
  // for details on why the magic below is necessary.

  // First encode the SVG string to individual UTF-8 bytes.
  const bytes = new TextEncoder().encode(svgText)
  // Then create a string from these bytes again, because btoa() accepts a
  // string. Note that this string will in general be different than the
  // original string (unless the original string was just ASCII), because it no
  // longer contains code points larger than 0xff.
  const bytesString = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join('')
  // Then convert the bytes string to Base64 with the stupid btoa() function.
  const base64String = btoa(bytesString)
  // Finally, add a header to create the data URL.
  return `data:image/svg+xml;base64,${base64String}`
}

export async function convertSvgElementToImageBitmap(
  svg: SVGSVGElement,
  targetSize: [number, number],
): Promise<ImageBitmap> {
  // Determine the width and height of the resulting bitmap based on the SVG
  // viewBox (if available) and the target size.
  const [width, height] = computeSvgBitmapSize(svg, targetSize)

  const image = new Image(width, height)
  image.src = convertSvgElementToDataUrl(svg, width, height)
  await image.decode()

  return createImageBitmap(image, {
    resizeWidth: width,
    resizeHeight: height,
    resizeQuality: 'high',
  })
}

function computeSvgBitmapSize(
  svg: SVGSVGElement,
  targetSize: [number, number],
): [number, number] {
  const viewBoxAspectRatio = getSvgViewBoxAspectRatio(svg)

  // If we don't have a viewbox, just use the target size.
  if (!viewBoxAspectRatio) return targetSize

  // Check whether we should fit to the height or width, depending on the
  // aspect ratio of the SVG w.r.t. to that of the desired size.
  const [targetWidth, targetHeight] = targetSize
  const targetAspectRatio = targetWidth / targetHeight
  let width
  let height
  if (viewBoxAspectRatio > targetAspectRatio) {
    width = targetWidth
    height = targetWidth / viewBoxAspectRatio
  } else {
    width = viewBoxAspectRatio * targetHeight
    height = targetHeight
  }
  return [width, height].map(Math.round) as [number, number]
}

function getSvgViewBoxAspectRatio(svg: SVGSVGElement): number | null {
  const viewBox = svg.getAttribute('viewBox')
  if (!viewBox) return null

  const [_offsetX, _offsetY, viewBoxWidth, viewBoxHeight] = viewBox
    .split(' ')
    .map(parseFloat) as [number, number, number, number]
  return viewBoxWidth / viewBoxHeight
}

const fetchedCss = new Map<string, string>() // url -> css text
type CssChunk = { css: string; baseUrl: string }

const formatMap: Record<string, { mime: string; format: string }> = {
  woff: { mime: 'font/woff', format: 'woff' },
  woff2: { mime: 'font/woff2', format: 'woff2' },
  ttf: { mime: 'font/ttf', format: 'truetype' },
  otf: { mime: 'font/otf', format: 'opentype' },
  eot: { mime: 'application/vnd.ms-fontobject', format: 'embedded-opentype' },
} as const

export async function fetchAndInlineCssAndFonts(mainCssUrl: string) {
  async function fetchCssRecursively(url: string): Promise<CssChunk[]> {
    if (fetchedCss.has(url)) {
      return [{ css: fetchedCss.get(url)!, baseUrl: url }]
    }

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch CSS at ${url}`)
    const cssText = await res.text()

    const importRegex =
      /@import\s+(?:url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])\s*;/g
    let chunks: CssChunk[] = []

    let lastIndex = 0
    let match
    while ((match = importRegex.exec(cssText)) !== null) {
      const importPath = match[1] || match[2]
      if (!importPath) continue

      // CSS before this import statement is a chunk for current CSS file
      const beforeImportCss = cssText.substring(lastIndex, match.index)
      if (beforeImportCss.trim()) {
        chunks.push({ css: beforeImportCss, baseUrl: url })
      }

      // Recursively get imported chunks
      const importUrl = new URL(importPath, url).href
      const importedChunks = await fetchCssRecursively(importUrl)
      chunks = chunks.concat(importedChunks)

      lastIndex = importRegex.lastIndex
    }

    // Add remaining CSS after last import as a chunk
    const afterImportsCss = cssText.substring(lastIndex)
    if (afterImportsCss.trim()) {
      chunks.push({ css: afterImportsCss, baseUrl: url })
    }

    // Cache combined CSS text for this URL (optional)
    fetchedCss.set(url, cssText)

    return chunks
  }

  async function inlineFontUrls(
    cssText: string,
    cssUrl: string,
  ): Promise<string> {
    const fontUrlRegex =
      /url\(\s*['"]?([^)'"]+\.(woff2?|ttf|otf|eot))['"]?\s*\)/gi
    const fontCache = new Map<string, string>()

    async function fontToDataUri(fontUrl: string): Promise<string> {
      if (fontCache.has(fontUrl)) return fontCache.get(fontUrl)!

      const absUrl = new URL(fontUrl, cssUrl).href
      const ext = absUrl.split('.').pop()?.toLowerCase() || ''
      const fmt = formatMap[ext]
      if (!fmt) throw new Error(`Unsupported font format: ${absUrl}`)

      const resp = await fetch(absUrl)
      if (!resp.ok) throw new Error(`Failed to fetch font at ${absUrl}`)

      const blob = await resp.blob()
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () =>
          resolve((reader.result as string).split(',')[1])
        reader.readAsDataURL(blob)
      })

      const dataUri = `data:${fmt.mime};base64,${base64}`
      fontCache.set(fontUrl, dataUri)
      return dataUri
    }

    // Find all font URLs and convert to data URI
    const fontUrls = Array.from(cssText.matchAll(fontUrlRegex), (m) => m[1])
    const urlToDataUri: Record<string, string> = {}

    await Promise.all(
      fontUrls.map(async (fontUrl) => {
        urlToDataUri[fontUrl] = await fontToDataUri(fontUrl)
      }),
    )

    // Replace all font URLs with data URIs + format
    return cssText.replace(fontUrlRegex, (match, p1) => {
      const dataUri = urlToDataUri[p1]
      if (!dataUri) return match
      return `url('${dataUri}')`
    })
  }

  async function inlineFontUrlsInChunks(chunks: CssChunk[]): Promise<string> {
    // inline fonts chunk by chunk, preserving correct relative paths
    const processedChunks = await Promise.all(
      chunks.map(({ css, baseUrl }) => inlineFontUrls(css, baseUrl)),
    )
    return processedChunks.join('\n')
  }

  const chunks = await fetchCssRecursively(mainCssUrl)
  const finalCss = await inlineFontUrlsInChunks(chunks)

  return finalCss
}
