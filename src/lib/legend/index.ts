import type { Style } from '@deltares/fews-wms-requests'
import type { ColourMap } from '@deltares/fews-web-oc-charts'
import type { Range } from '@/stores/colourScales'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'

export function rangeToString(range: Range): string {
  return `${range.min},${range.max}`
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

export function getSeriesByLegend(series: ChartSeries[]) {
  const seriesByLegend: Record<string, ChartSeries[]> = {}
  series
    .filter((s) => s.visibleInLegend)
    .forEach((s) => {
      if (!seriesByLegend[s.name]) {
        seriesByLegend[s.name] = []
      }
      seriesByLegend[s.name].push(s)
    })
  return seriesByLegend
}
