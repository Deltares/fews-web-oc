import {
  MouseOver,
  type CartesianAxes,
  type Chart,
} from '@deltares/fews-web-oc-charts'
import type { ChartConfig } from './types/ChartConfig'
import type { ChartSeries } from './types/ChartSeries'
import type { Series } from '../timeseries/timeSeries'

interface EnsembleHoverSummary {
  member: string
  value: number
  minimum: number
  maximum: number
  unit: string
}

interface EnsembleHoverGroup {
  summary: EnsembleHoverSummary
  distance: number
  color: string
  chart: Chart
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
    const groups = new Map<string, EnsembleHoverGroup>()

    for (const chart of this.chartAxes.charts) {
      const item = items.get(chart.id)
      if (item?.type !== 'line' || item.dataResources.length !== 1) continue
      const ensemble = resources[item.dataResources[0]]?.ensemble
      if (!ensemble) continue
      ensembleIds.add(chart.id)
      const hovered = this.getHoveredMember(chart, item, ensemble, mouse)
      if (!hovered) continue
      const key = JSON.stringify([
        ensemble.requestKey,
        item.name,
        chart.axisIndex,
      ])
      this.updateGroup(groups, key, hovered)
    }

    const nearest = new Set(Array.from(groups.values(), ({ chart }) => chart))
    this.highlightNearestMembers(ensembleIds, nearest)

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

  private getHoveredMember(
    chart: Chart,
    item: ChartSeries,
    ensemble: NonNullable<Series['ensemble']>,
    mouse: [number, number],
  ): EnsembleHoverGroup | undefined {
    if (!chart.visible || !chart.axisIndex.x || !chart.axisIndex.y) return
    const xScale = this.chartAxes.xScales[chart.axisIndex.x.axisIndex]
    const yScale = this.chartAxes.yScales[chart.axisIndex.y.axisIndex]
    const hovered = chart.onPointerMove(
      xScale.invert(mouse[0]),
      'x',
      xScale,
      yScale,
    )
    const value = hovered?.point.y
    if (typeof value !== 'number' || !Number.isFinite(value)) return
    return {
      summary: {
        member: ensemble.memberId,
        value,
        minimum: value,
        maximum: value,
        unit: item.unit,
      },
      distance: Math.abs(yScale(value) - mouse[1]),
      chart,
      color: String(hovered?.style.color ?? item.style.stroke ?? ''),
    }
  }

  private updateGroup(
    groups: Map<string, EnsembleHoverGroup>,
    key: string,
    hovered: EnsembleHoverGroup,
  ) {
    const group = groups.get(key)
    if (!group) {
      groups.set(key, hovered)
      return
    }
    group.summary.minimum = Math.min(
      group.summary.minimum,
      hovered.summary.value,
    )
    group.summary.maximum = Math.max(
      group.summary.maximum,
      hovered.summary.value,
    )
    if (hovered.distance < group.distance) {
      group.summary.member = hovered.summary.member
      group.summary.value = hovered.summary.value
      group.distance = hovered.distance
      group.chart = hovered.chart
    }
  }

  private highlightNearestMembers(
    ensembleIds: Set<string>,
    nearest: Set<Chart>,
  ) {
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
      const width = Number.parseFloat(getComputedStyle(path).strokeWidth)
      path.style.setProperty('stroke-width', `${Math.max(2.5, width + 1.5)}px`)
    }
  }

  override updateTooltip(spans: HTMLSpanElement[], mouse: [number, number]) {
    super.updateTooltip([...spans, ...this.summaries], mouse)
  }
}
