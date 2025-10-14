const inlinedCssCache = new Map<string, string>() // url -> inlined css text
type CssChunk = { css: string; baseUrl: string }

const formatMap: Record<string, { mime: string; format: string }> = {
  woff: { mime: 'font/woff', format: 'woff' },
  woff2: { mime: 'font/woff2', format: 'woff2' },
  ttf: { mime: 'font/ttf', format: 'truetype' },
  otf: { mime: 'font/otf', format: 'opentype' },
  eot: { mime: 'application/vnd.ms-fontobject', format: 'embedded-opentype' },
} as const

async function fetchCssRecursively(url: string): Promise<CssChunk[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch CSS at ${url}`)
  const cssText = await res.text()

  const importRegex =
    /@import\s+(?:url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])\s*;/g
  let chunks: CssChunk[] = []

  let lastIndex = 0
  let match
  while ((match = importRegex.exec(cssText)) !== null) {
    const importPath = match[1] ?? match[2]
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
    const ext = absUrl.split('.').pop()?.toLowerCase() ?? ''
    const fmt = formatMap[ext]
    if (!fmt) throw new Error(`Unsupported font format: ${absUrl}`)

    const response = await fetch(absUrl)
    if (!response.ok) throw new Error(`Failed to fetch font at ${absUrl}`)

    const blob = await response.blob()
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve((reader.result as string).split(',')[1])
      reader.readAsDataURL(blob)
    })

    const dataUri = `data:${fmt.mime};base64,${base64}`
    fontCache.set(fontUrl, dataUri)
    return dataUri
  }

  // Find all font URLs and convert to data URI
  const fontUrls = Array.from(cssText.matchAll(fontUrlRegex), (m) => m[1])
  const urlToDataUri: Record<string, string> = {}

  await Promise.allSettled(
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

export async function fetchAndInlineCssAndFonts(mainCssUrl: string) {
  if (inlinedCssCache.has(mainCssUrl)) {
    return inlinedCssCache.get(mainCssUrl)!
  }

  const chunks = await fetchCssRecursively(mainCssUrl)
  const finalCss = await inlineFontUrlsInChunks(chunks)

  // Cache the final CSS text for this URL
  inlinedCssCache.set(mainCssUrl, finalCss)

  return finalCss
}
