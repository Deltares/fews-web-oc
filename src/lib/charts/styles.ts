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

export function cssStyleFromFewsLine(item: {
  lineStyle?: string
  color?: string
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
  style.stroke = item.color === '#000000' ? 'currentColor' : item.color
  return style
}

export function cssStyleFromFewsArea(item: {
  lineStyle?: string
  color?: string
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
  style.fill = item.color === '#000000' ? 'currentColor' : item.color
  return style
}


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

export function cssStyleFromFewsMarker(item: {
  markerStyle?: string
  color?: string
}): SvgPropertiesHyphen {
  const color = item.color === '#000000' ? 'currentColor' : item.color
  const style: SvgPropertiesHyphen = {
    stroke: color,
    fill: color,
  }
  return style
}

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
