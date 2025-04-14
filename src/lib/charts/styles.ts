import { SvgPropertiesHyphen } from 'csstype'
import { SymbolOptions } from '@deltares/fews-web-oc-charts'

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
 * Converts a hexadecimal color code to its RGB representation.
 * @param hex - The hexadecimal color code to convert.
 * @param alpha - Optional alpha value for the RGBA representation.
 * @returns The RGB or RGBA representation of the color code.
 */
function hexToRGB(hex: string, alpha?: string | number) {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16)

  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } else {
    return `rgb(${r}, ${g}, ${b})`
  }
}

/**
 * Converts the FEWS line properties to SVG style properties.
 * @param item - The FEWS line style properties.
 * @returns The SVG style properties.
 */
export function cssStyleFromFewsLine(item: {
  lineStyle?: string
  lineWidth?: number
  color?: string
  opaquenessPercentage?: number
}): SvgPropertiesHyphen {
  let style: SvgPropertiesHyphen = {}

  style['fill'] = 'none'
  const re =
    /(?<lineStyle>none|solid|dashed|dashdot|dotted)(;(?<lineWidth>thick))?/
  if (item.lineStyle !== undefined) {
    const matches = item.lineStyle.match(re)
    if (matches?.groups?.lineStyle !== undefined) {
      style = {
        ...style,
        ...cssStyleFromFewsLineStyle(matches.groups.lineStyle),
      }
    }
    if (item.lineWidth) {
      style = {
        ...style,
        ...{ 'stroke-width': `${item.lineWidth}` },
      }
    } else if (matches?.groups?.lineWidth !== undefined) {
      style = {
        ...style,
        ...cssStyleFromFewsLineWidth(matches.groups.lineWidth),
      }
    }
  }
  const alpha = item.opaquenessPercentage ? item.opaquenessPercentage / 100 : 1
  style.stroke =
    item.color === undefined || item.color === '#000000'
      ? 'currentColor'
      : hexToRGB(item.color, alpha)
  return style
}

/**
 * Converts FEWS area properties to SVG CSS styles.
 * @param item - The FEWS area properties.
 * @returns The SVG CSS styles.
 */
export function cssStyleFromFewsArea(item: {
  lineStyle?: string
  color?: string
  opaquenessPercentage?: number
}): SvgPropertiesHyphen {
  let style: SvgPropertiesHyphen = {}

  style['fill'] = 'none'
  const re =
    /(?<lineStyle>none|solid|dashed|dashdot|dotted)(;(?<lineWidth>thick))?/
  if (item.lineStyle !== undefined) {
    const matches = item.lineStyle.match(re)
    if (matches?.groups?.lineWidth !== undefined) {
      style = {
        ...style,
        ...cssStyleFromFewsLineStyle(matches.groups.lineStyle),
      }
    }
    if (matches?.groups?.lineWidth !== undefined) {
      style = {
        ...style,
        ...cssStyleFromFewsLineWidth(matches.groups.lineWidth),
      }
    }
  }
  const alpha = item.opaquenessPercentage ? item.opaquenessPercentage / 100 : 1
  style.fill =
    item.color === undefined || item.color === '#000000'
      ? 'currentColor'
      : hexToRGB(item.color, alpha)
  return style
}

/**
 * Converts FEWS bar properties to SVG CSS styles.
 * @param item - The FEWS area properties.
 * @returns The SVG CSS styles.
 */
export function cssStyleFromFewsBar(item: {
  lineStyle?: string
  color?: string
  opaquenessPercentage?: number
}): SvgPropertiesHyphen {
  const style = cssStyleFromFewsArea(item)
  style['shape-rendering'] = 'crispEdges'
  return style
}

/**
 * Converts a FEWS line style to CSS style properties for an SVG element.
 * @param lineStyle - The FEWS line style to convert.
 * @returns The CSS style properties for the SVG element.
 */
function cssStyleFromFewsLineStyle(lineStyle: string): SvgPropertiesHyphen {
  const style: SvgPropertiesHyphen = {}
  switch (lineStyle) {
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
    case 'none':
    case 'solid':
    default:
      break
  }
  return style
}

/**
 * Converts a FEWS line width value to an SVG style object.
 * @param lineWidth - The line width value from FEWS.
 * @returns The SVG style object with the converted line width.
 */
function cssStyleFromFewsLineWidth(lineWidth: string): SvgPropertiesHyphen {
  const style: SvgPropertiesHyphen = {}
  switch (lineWidth) {
    case 'thick':
      style['stroke-width'] = '2px'
      break
    default:
      style['stroke-width'] = '1px'
      break
  }
  return style
}

/**
 * Converts a FEWS marker object to CSS styles for an SVG element.
 * @param item - The FEWS marker object.
 * @returns The CSS styles for the SVG element.
 */
export function cssStyleFromFewsMarker(item: {
  markerStyle?: string
  color?: string
}): SvgPropertiesHyphen {
  const color =
    item.color === undefined || item.color === '#000000'
      ? 'currentColor'
      : item.color
  const style: SvgPropertiesHyphen = {
    stroke: color,
    fill: color,
  }
  return style
}

/**
 * Converts a FEWS style string to a chart marker symbol.
 * @param style - The FEWS style string.
 * @param pointSize - The size of the marker symbol.
 * @returns The symbol options for the chart marker.
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
