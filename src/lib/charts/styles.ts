import type { SvgPropertiesHyphen } from 'csstype'
import type { SymbolOptions } from '@deltares/fews-web-oc-charts'

const SymbolType = {
  Circle: 0,
  Cross: 1,
  Diamond: 2,
  Square: 3,
  Asterisk: 4,
  TriangleUp: 5,
  Wye: 6,
} as const

type SymbolType = (typeof SymbolType)[keyof typeof SymbolType]

/**
 * Converts FEWS line style and color to CSS style properties for SVG elements.
 * @param item - An object containing lineStyle and color properties.
 * @returns An object containing CSS style properties for SVG elements.
 */
export function cssStyleFromFewsLine(item: {
  lineStyle?: string
  color?: string
}): SvgPropertiesHyphen {
  const style: SvgPropertiesHyphen = {}

  style['fill'] = 'none'

  if (item.lineStyle !== undefined && item.lineStyle.includes('thick')) {
    style['stroke-width'] = '2px'
  } else {
    style['stroke-width'] = '1px'
  }

  switch (item.lineStyle) {
    case 'none':
    case 'solid':
      break
    case 'dashed':
      style['stroke-dasharray'] = '5 5'
      break
    case 'dashdot':
      style['stroke-dasharray'] = '5 5 1 5'
      break
    case 'dotted':
      style['stroke-dasharray'] = '2 3'
      style['stroke-linecap'] = 'round'
      break
  }
  style.stroke = colorFromFewsColor(item.color)
  return style
}

/**
 * Returns the input color if it is not equal to '#000000', otherwise returns 'currentColor'.
 * @param color - The input color to be checked.
 * @returns css color.
 */
export function colorFromFewsColor<T = string | undefined>(color: T): T {
  const currentColor = 'currentColor' as T
  return color === '#000000' ? currentColor : color
}

/**
 * Returns a CSS style object for a FEWS marker.
 * @param item An object containing the marker style and color.
 * @returns A CSS style object with stroke and fill properties set to the specified color.
 */
export function cssStyleFromFewsMarker(item: {
  markerStyle?: string
  color?: string
}): SvgPropertiesHyphen {
  const color = colorFromFewsColor(item.color)
  const style: SvgPropertiesHyphen = {
    stroke: color,
    fill: color,
  }
  return style
}

/**
 * Returns a SymbolOptions object for a chart marker based on the given style and point size.
 * @param style - The style of the chart marker.
 * @param pointSize - The size of the chart marker.
 * @returns A SymbolOptions object for the chart marker.
 */
export function chartMarkerFromFews(
  style: string,
  pointSize: number = 3,
): SymbolOptions {
  const marker: SymbolOptions = {
    id: SymbolType.Circle,
    size: (pointSize / 0.75) ** 2,
    skip: 1,
  }
  switch (style) {
    case 'none':
      break
    case 'diamond':
      marker.id = SymbolType.Diamond
      break
    case 'square':
      marker.id = SymbolType.Square
      break
    case 'triangleup':
      marker.id = SymbolType.TriangleUp
      break
    case 'triangledown':
      marker.id = SymbolType.TriangleUp
      break
    case 'circle':
      marker.id = SymbolType.Circle
      break
    case 'x':
      marker.id = SymbolType.Wye
      break
    case '+':
      marker.id = SymbolType.Cross
      break
    case 'rectangle':
      marker.id = SymbolType.Square
      break
  }
  return marker
}
