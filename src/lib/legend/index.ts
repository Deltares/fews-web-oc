import type {
  Style,
  GetLegendGraphicResponse,
} from '@deltares/fews-wms-requests'
import type { ColourMap } from '@deltares/fews-web-oc-charts'
import type { Range } from '@/stores/colourScales'

export function rangeToString(range: Range): string {
  return `${range.min},${range.max}`
}

export function getLegendTitle(
  layerTitle: string,
  legendGraphic: GetLegendGraphicResponse,
) {
  const unitString = legendGraphic.unit ? ` [${legendGraphic.unit}]` : ''
  return `${layerTitle}${unitString}`
}

export function styleToId(style: Style) {
  return style.name ?? style.title
}

export function legendToRange(legend: ColourMap): Range {
  return {
    min: legend[0].lowerValue,
    max: legend[legend.length - 1].lowerValue,
  }
}
