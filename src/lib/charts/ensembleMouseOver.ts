import {
  MouseOver,
  type CartesianAxes,
  type Chart,
} from '@deltares/fews-web-oc-charts'
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
  private highlightedPaths: {
    path: SVGPathElement
    width: string
    priority: string
  }[] = []

  private clearHighlights() {
    for (const { path, width, priority } of this.highlightedPaths) {
      if (width) path.style.setProperty('stroke-width', width, priority)
      else path.style.removeProperty('stroke-width')
    }
    this.highlightedPaths = []
  }

  override onPointerout() {
    this.clearHighlights()
    super.onPointerout()
  }

  override redraw() {
    this.clearHighlights()
    super.redraw()
  }

  constructor(
    private readonly chartAxes: CartesianAxes,
    private readonly getConfig: () => ChartConfig,
    private readonly getSeries: () => Record<string, Series>,
    private readonly formatSummary: (summary: EnsembleHoverSummary) => string,
  ) {
    super()
  }

  override updateChartIndicators(mouse: [number, number]) {
    this.clearHighlights()
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
        chart: Chart
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
          chart,
          color: String(hovered?.style.color ?? item.style.stroke ?? ''),
        })
      } else {
        group.summary.minimum = Math.min(group.summary.minimum, value)
        group.summary.maximum = Math.max(group.summary.maximum, value)
        if (distance < group.distance) {
          group.summary.member = ensemble.memberId
          group.summary.value = value
          group.distance = distance
          group.chart = chart
        }
      }
    }

    const nearest = new Set(Array.from(groups.values(), ({ chart }) => chart))
    for (const chart of this.chartAxes.charts) {
      if (!ensembleIds.has(chart.id)) continue
      if (!nearest.has(chart)) {
        chart.onPointerOut()
        continue
      }
      const path = chart.group.select<SVGPathElement>('path').node()
      if (!path) continue
      this.highlightedPaths.push({
        path,
        width: path.style.getPropertyValue('stroke-width'),
        priority: path.style.getPropertyPriority('stroke-width'),
      })
      const width = parseFloat(getComputedStyle(path).strokeWidth)
      path.style.setProperty('stroke-width', `${Math.max(2.5, width + 1.5)}px`)
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
