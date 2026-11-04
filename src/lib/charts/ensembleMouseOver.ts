import { MouseOver, type CartesianAxes } from '@deltares/fews-web-oc-charts'
import type { ChartConfig } from './types/ChartConfig'
import type { Series } from '../timeseries/timeSeries'

interface EnsembleHoverSummary {
  member: string
  value: number
  minimum: number
  maximum: number
  unit: string
}

export class EnsembleMouseOver extends MouseOver {
  private summaries: HTMLSpanElement[] = []

  constructor(
    private readonly chartAxes: CartesianAxes,
    private readonly getConfig: () => ChartConfig,
    private readonly getSeries: () => Record<string, Series>,
    private readonly formatSummary: (summary: EnsembleHoverSummary) => string,
  ) {
    super()
  }

  override updateChartIndicators(mouse: [number, number]) {
    const items = new Map(
      this.getConfig().series.map((item) => [item.id, item]),
    )
    const resources = this.getSeries()
    const ensembleIds = new Set<string>()
    const groups = new Map<
      string,
      {
        summary: EnsembleHoverSummary
        distance: number
        color: string
      }
    >()

    for (const chart of this.chartAxes.charts) {
      const item = items.get(chart.id)
      if (item?.type !== 'line' || item.dataResources.length !== 1) continue
      const ensemble = resources[item.dataResources[0]]?.ensemble
      if (!ensemble) continue
      ensembleIds.add(chart.id)
      if (!chart.visible) continue

      if (!chart.axisIndex.x || !chart.axisIndex.y) continue
      const xScale = this.chartAxes.xScales[chart.axisIndex.x.axisIndex]
      const yScale = this.chartAxes.yScales[chart.axisIndex.y.axisIndex]
      const hovered = chart.onPointerMove(
        xScale.invert(mouse[0]),
        'x',
        xScale,
        yScale,
      )
      const value = hovered?.point.y
      if (typeof value !== 'number' || !Number.isFinite(value)) continue
      const distance = Math.abs(yScale(value) - mouse[1])
      const key = JSON.stringify([
        ensemble.requestKey,
        item.name,
        chart.axisIndex,
      ])
      const group = groups.get(key)
      if (!group) {
        groups.set(key, {
          summary: {
            member: ensemble.memberId,
            value,
            minimum: value,
            maximum: value,
            unit: item.unit,
          },
          distance,
          color: String(hovered?.style.color ?? item.style.stroke ?? ''),
        })
      } else {
        group.summary.minimum = Math.min(group.summary.minimum, value)
        group.summary.maximum = Math.max(group.summary.maximum, value)
        if (distance < group.distance) {
          group.summary.member = ensemble.memberId
          group.summary.value = value
          group.distance = distance
        }
      }
    }

    this.summaries = Array.from(groups.values(), ({ summary, color }) => {
      const span = document.createElement('span')
      span.className = 'ensemble-hover-summary'
      span.style.color = color
      span.textContent = this.formatSummary(summary)
      return span
    })

    this.setTrace(
      this.chartAxes.charts
        .filter((chart) => !ensembleIds.has(chart.id))
        .map((chart) => chart.id),
    )
    try {
      super.updateChartIndicators(mouse)
    } finally {
      this.setTrace(undefined)
    }
  }

  override updateTooltip(spans: HTMLSpanElement[], mouse: [number, number]) {
    super.updateTooltip([...spans, ...this.summaries], mouse)
  }
}
