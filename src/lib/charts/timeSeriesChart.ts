import {
  CartesianAxes,
  ChartArea,
  ChartBar,
  ChartLine,
  ChartMarker,
  ChartMatrix,
  ChartRule,
  TooltipAnchor,
  TooltipOptions,
} from '@deltares/fews-web-oc-charts'
import { ChartConfig } from './types/ChartConfig'
import { ChartSeries } from './types/ChartSeries'
import { Series } from '../timeseries/timeSeries'
import { dataFromResources, removeUnreliableData } from './dataFromResources'
import {
  getColorMap,
  horizontalColorCodeDataFromData,
} from './horizontalColorCode'

export function clearChart(axis: CartesianAxes) {
  axis.removeAllCharts()
  axis.removeInitialExtent()
}

function addToChart(
  axis: CartesianAxes,
  chartSeries: ChartSeries,
  series: Record<string, Series>,
) {
  const id = chartSeries.id

  const rawData = dataFromResources(chartSeries.dataResources, series)
  const data = removeUnreliableData(rawData)

  const tooltip: TooltipOptions = {
    toolTipFormatter: (d) => {
      const tooltipElement = document.createElement('div')
      const yValueLabel = Array.isArray(d.y) ? d.y.join('-') : d.y
      tooltipElement.innerText = `${yValueLabel} ${chartSeries.unit}`
      return tooltipElement
    },
    anchor: TooltipAnchor.Top,
  }

  let chart
  switch (chartSeries.type) {
    case 'dummy':
      break
    case 'line':
      chart = new ChartLine(data, {})
      break
    case 'area':
      chart = new ChartArea(data, {})
      break
    case 'rule':
      chart = new ChartRule(data, { tooltip })
      break
    case 'bar':
      chart = new ChartBar(data, { tooltip })
      break
    case 'horizontalColorCode':
      const matrixData = horizontalColorCodeDataFromData(chartSeries, data)
      chart = new ChartMatrix(matrixData, {
        y: {
          paddingInner: chartSeries.barMargin,
        },
        color: {
          map: getColorMap(chartSeries.classBreaks),
        },
        tooltip,
      })
      break
    default:
      chart = new ChartMarker(data, {
        symbol: chartSeries.marker,
        tooltip,
      })
  }
  if (chart === undefined) return
  chart.addTo(axis, chartSeries.options, id, chartSeries.style)
}

export function refreshChart(
  axis: CartesianAxes,
  config: ChartConfig,
  series: Record<string, Series>,
) {
  /* Adds charts to the axis if not yet present, and removes charts that should no longer be there */
  const ids: string[] = axis.charts.map((c: any) => c.id)
  const removeIds: string[] = axis.charts.map((c: any) => c.id)
  if (config?.series === undefined) return
  for (const seriesData of config.series) {
    if (!seriesData.visibleInPlot) continue
    if (!ids.includes(seriesData.id)) {
      addToChart(axis, seriesData, series)
    }
    const index = removeIds.findIndex((item) => {
      return item === seriesData.id
    })
    if (index >= 0) removeIds.splice(index, 1)
  }
  for (const id of removeIds) {
    axis.removeChart(id)
  }
  if (config.xAxis) {
    axis.setOptions({
      x: config.xAxis,
    })
  }
  if (config.yAxis) {
    axis.setOptions({
      y: config.yAxis,
    })
  }
}

export function updateChartData(
  axis: CartesianAxes,
  chartSeries: ChartSeries[],
  series: Record<string, Series>,
  hasResetAxes: boolean = false,
) {
  let allMissingData = true
  chartSeries.forEach((chartSeries) => {
    const charts = axis.charts.filter((chart) => chart.id == chartSeries.id)
    if (charts.length === 0) return

    const hasMissingResource = chartSeries.dataResources.some(
      (id) => series[id] === undefined,
    )
    if (hasMissingResource) return

    const rawData = dataFromResources(chartSeries.dataResources, series)
    const data = removeUnreliableData(rawData)

    const matrixData =
      chartSeries.type === 'horizontalColorCode'
        ? horizontalColorCodeDataFromData(chartSeries, data)
        : undefined

    // Update each matching chart
    charts.forEach((chart) => {
      // Keep track of whether all charts had missing data before this data
      // update, in that case we should reset the y-axes as the domain is
      // probably [NaN, NaN].
      allMissingData &&= chart.data === undefined || chart.data.length === 0
      chart.data = matrixData ?? data
    })
  })
  const needsAxisRescale = allMissingData || hasResetAxes
  if (needsAxisRescale) {
    // Autoscale only the y-axis, the x-axis should keep the domain set from
    // the start and end time or zooming.
    axis.redraw({
      x: {
        nice: false,
        domain: undefined,
        fullExtent: false,
      },
      y: { autoScale: true },
    })
  } else {
    // Ensure the current zoom, which might be user-selected, does not change
    axis.redraw({
      x: {
        nice: false,
        domain: undefined,
        fullExtent: false,
      },
      y: {
        nice: false,
        domain: undefined,
        fullExtent: false,
      },
    })
  }

  return needsAxisRescale
}

export function redraw(axis: CartesianAxes, config?: ChartConfig) {
  const xDomain = config?.xAxis?.[0]?.domain
  if (xDomain) {
    axis.redraw({ x: { domain: xDomain }, y: { autoScale: true } })
  } else {
    axis.redraw({ x: { autoScale: true }, y: { autoScale: true } })
  }
}
