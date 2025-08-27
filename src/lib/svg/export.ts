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

export interface Offset {
  dx: number
  dy: number
}

export function combineSvgParts(
  svgElements: SVGSVGElement[],
  spacing: number = 10, // default vertical spacing
): SVGSVGElement {
  if (svgElements.length === 0) {
    throw new Error('No SVG elements provided')
  }

  const outputDoc = document.implementation.createDocument('', '', null)
  const newSvg = outputDoc.createElementNS('http://www.w3.org/2000/svg', 'svg')

  let currentY = 0
  let maxWidth = 0

  svgElements.forEach((svg) => {
    const width = parseFloat(svg.getAttribute('width') ?? '100')
    const height = parseFloat(svg.getAttribute('height') ?? '100')
    maxWidth = Math.max(maxWidth, width)

    // Wrap the contents in a <g> with transform to offset vertically
    const group = outputDoc.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.setAttribute('transform', `translate(0, ${currentY})`)

    const children = Array.from(svg.children)
    children.forEach((child) => {
      const imported = outputDoc.importNode(child, true)
      group.appendChild(imported)
    })

    newSvg.appendChild(group)
    currentY += height + spacing
  })

  // Set total dimensions
  newSvg.setAttribute('width', `${maxWidth}`)
  newSvg.setAttribute('height', `${currentY - spacing}`) // remove last extra spacing
  newSvg.setAttribute('viewBox', `0 0 ${maxWidth} ${currentY - spacing}`)

  return newSvg
}

function getSvgViewBoxAspectRatio(svg: SVGSVGElement): number | null {
  const viewBox = svg.getAttribute('viewBox')
  if (!viewBox) return null

  const [_offsetX, _offsetY, viewBoxWidth, viewBoxHeight] = viewBox
    .split(' ')
    .map(parseFloat) as [number, number, number, number]
  return viewBoxWidth / viewBoxHeight
}
