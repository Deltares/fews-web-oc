import { ChartMarkerOptions } from "@/components/TimeSeriesComponent/lib/ChartMarkerOptions.js"
import * as CSS from "csstype"
import * as d3 from "d3"

const d3Circle = 0
const d3Cross = 1
const d3Diamond = 2
const d3Square = 3
const d3Asterisk = 4
const d3Triangle = 5
const d3Wye = 6

export function cssLineStyleFromFews(lineStyle: string): CSS.SvgPropertiesHyphen {
    const style: CSS.SvgPropertiesHyphen = {}

    style['fill'] = "none"

    if (lineStyle.includes('thick')) {
        style['stroke-width'] = '2px'
    } else {
        style['stroke-width'] = '1px'
    }

    switch (lineStyle) {
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
            style['stroke-dasharray'] = '1 5'
            break
    }
    return style
}

export function chartMarkerFromFews(style: string, pointSize: number = 3): ChartMarkerOptions {
    const marker: ChartMarkerOptions = {
        id: 0,
        size: (pointSize/0.75)**2
    }

    switch (style) {
        case "none":
            break
        case "diamond":
            marker.id = d3Diamond
            break
        case "square":
            marker.id = d3Square
            break
        case "triangleup":
            marker.id = d3Triangle
            break
        case "triangledown":
            marker.id = d3Triangle
            break
        case "circle":
            marker.id = d3Circle
            break
        case "x":
            marker.id = d3Wye
            break
        case "+":
            marker.id = d3Cross
            break
        case "rectangle":
            marker.id = d3Square
            break
    }
    return marker
}
