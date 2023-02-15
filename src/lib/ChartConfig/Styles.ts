import { ChartMarkerOptions } from "@/components/TimeSeriesComponent/lib/ChartMarkerOptions.js"
import * as CSS from "csstype"
import { symbolCircle, symbolCross, symbolDiamond2, symbolSquare, symbolSquare2, symbolTriangle2, symbolWye,  } from "d3"



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
        id: symbolCircle,
        size: (pointSize/0.75)**2
    }

    switch (style) {
        case "none":
            break
        case "diamond":
            marker.id = symbolDiamond2
            break
        case "square":
            marker.id = symbolSquare2
            break
        case "triangleup":
            marker.id = symbolTriangle2
            break
        case "triangledown":
            marker.id = symbolTriangle2
            break
        case "circle":
            marker.id = symbolCircle
            break
        case "x":
            marker.id = symbolWye
            break
        case "+":
            marker.id = symbolCross
            break
        case "rectangle":
            marker.id = symbolSquare
            break
    }
    return marker
}
