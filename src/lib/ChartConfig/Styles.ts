import * as CSS from "csstype"
import { SymbolOptions } from "@deltares/fews-web-oc-charts"

const SymbolType = {
  Circle: 0,
  Cross: 1,
  Diamond: 2,
  Square: 3,
  Asterisk: 4,
  TriangleUp: 5,
  Wye: 6
} as const

type SymbolType = (typeof SymbolType)[keyof typeof SymbolType];

export function cssStyleFromFewsLine(item: { lineStyle?: string, color?: string}): CSS.SvgPropertiesHyphen {
    const style: CSS.SvgPropertiesHyphen = {}

    style['fill'] = "none"

    if (item.lineStyle !== undefined && item.lineStyle.includes('thick')) {
        style['stroke-width'] = '2px'
    } else {
        style['stroke-width'] = '1px'
    }

    switch (item.lineStyle) {
        case "none":
        case "solid":
            break
        case "dashed":
            style['stroke-dasharray'] = '5 5'
            break
        case "dashdot":
            style['stroke-dasharray'] = '5 5 1 5'
            break
        case "dotted":
            style['stroke-dasharray'] = '2 3'
            style['stroke-linecap'] = 'round'
            break
    }
    style.stroke =  item.color === '#000000' ? 'currentColor' : item.color
    return style
}

export function cssStyleFromFewsMarker(item: { markerStyle?: string, color?: string}): CSS.SvgPropertiesHyphen {
  const color = item.color === '#000000' ?'currentColor' : item.color
  const style: CSS.SvgPropertiesHyphen = {
    stroke: color,
    fill: color,
  }
  return style
}

export function chartMarkerFromFews(style: string, pointSize: number = 3): SymbolOptions {
    const marker: SymbolOptions = {
        id: SymbolType.Circle,
        size: (pointSize/0.75)**2,
        skip: 1
    }
    switch (style) {
        case "none":
            break
        case "diamond":
            marker.id = SymbolType.Diamond
            break
        case "square":
            marker.id = SymbolType.Square
            break
        case "triangleup":
            marker.id = SymbolType.TriangleUp
            break
        case "triangledown":
            marker.id = SymbolType.TriangleUp
            break
        case "circle":
            marker.id = SymbolType.Circle
            break
        case "x":
            marker.id = SymbolType.Wye
            break
        case "+":
            marker.id = SymbolType.Cross
            break
        case "rectangle":
            marker.id = SymbolType.Square
            break
    }
    return marker
}
