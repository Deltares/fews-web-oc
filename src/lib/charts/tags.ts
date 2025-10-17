import { getSeriesByLegend } from '../legend'
import type { ChartConfig } from './types/ChartConfig'
import type { ChartSeries } from './types/ChartSeries'
import type { CartesianAxes } from '@deltares/fews-web-oc-charts'

export interface Tag {
  id: string
  name: string
  disabled: boolean
  legendSvg: string
  tooltip?: string
  interactive: boolean
  seriesIds?: string[]
}

export function getMatchingIndexedString(item: string, text?: string) {
  if (!text) return

  const match = item.match(/\[(\d+)\]/)?.[0]
  if (!match) return

  return text.split('\n').find((line) => line.includes(match))
}

export function getSeriesTags(
  axis: CartesianAxes,
  series: ChartSeries[],
  forecastLegend?: string,
) {
  const s = new XMLSerializer()
  const seriesByLegend = getSeriesByLegend(series)

  return Object.values(seriesByLegend).map((series) => {
    const { svgGroup, legendSvg } = createChip()
    // In case of multiple series with the same label, we only show the
    // legend for the first series.
    const firstSeries = series[0]

    for (const chart of axis.charts) {
      if (chart.id === firstSeries.id) {
        let node = chart.drawLegendSymbol(undefined, true)
        svgGroup.appendChild(node)
      }
    }
    legendSvg.appendChild(svgGroup)
    const name = series.find((s) => s.id === firstSeries.id)?.name ?? ''
    return {
      id: firstSeries.id,
      name,
      disabled: false,
      legendSvg: s.serializeToString(legendSvg),
      tooltip: getMatchingIndexedString(name, forecastLegend),
      interactive: true,
      seriesIds: series
        .map((s) => s.id)
        .filter((id, index, self) => self.indexOf(id) === index),
    }
  })
}

export function getHorizontalColorCodeTags(series: ChartSeries[]) {
  const s = new XMLSerializer()
  const classBreaks = series[0]?.classBreaks ?? []

  const classBreakTags = classBreaks.map((classBreak) => {
    const { legendSvg } = createChip()

    // Create a rect svg with height and widht of 20px and color from classBreak
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', '20')
    rect.setAttribute('height', '20')
    rect.setAttribute('fill', classBreak.color)

    legendSvg.appendChild(rect)

    return {
      id: classBreak.label,
      name: classBreak.label,
      disabled: false,
      interactive: false,
      legendSvg: s.serializeToString(legendSvg),
    }
  })

  const parameterTags = series
    .filter((s) => s.type === 'line' && s.visibleInLegend)
    .map((series) => ({
      id: series.name,
      name: series.name,
      disabled: false,
      interactive: false,
      legendSvg: '',
    }))
  return [...classBreakTags, ...parameterTags]
}

export function getThresholdTag(config: ChartConfig): Tag | undefined {
  const hasThresholds = config.series.some((s) => s.thresholds?.length)
  if (!hasThresholds) return

  const { svgGroup, legendSvg } = createChip()
  legendSvg.appendChild(svgGroup)

  return {
    id: 'Thresholds',
    name: 'Thresholds',
    disabled: false,
    legendSvg:
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2L1 21Z"/></svg>',
    interactive: true,
  }
}

function createChip() {
  const legendSvg = document.createElement('svg')
  legendSvg.setAttribute('width', '20')
  legendSvg.setAttribute('height', '20')
  legendSvg.setAttribute('viewBox', '0 0 20 20')
  const svgGroup = document.createElement('g')
  svgGroup.setAttribute('transform', 'translate(0 10)')
  return { svgGroup, legendSvg }
}
