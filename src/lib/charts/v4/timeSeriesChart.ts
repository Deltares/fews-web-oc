import {
  CartesianAxes,
  ChartArea,
  ChartBar,
  ChartLine,
  ChartMarker as V4ChartMarker,
  ChartMatrix,
  ChartRule,
  DataValue,
  MouseOverOptions,
  SymbolOptions,
  TooltipAnchor,
  type ChartOptions,
  type DataPoint,
} from '@deltares/fews-web-oc-charts'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import type { ChartMarker } from '@/lib/charts/types/ChartMarker'
import type { Series } from '@/lib/timeseries/timeSeries'
import type {
  SeriesArrayData,
  SeriesData,
} from '@/lib/timeseries/types/SeriesData'
import { dataFromResources, removeUnreliableData } from '../dataFromResources'
import {
  getColorMap,
  horizontalColorCodeDataFromData,
} from '../horizontalColorCode'

const symbolIds: Record<ChartMarker['shape'], number> = {
  circle: 0,
  cross: 1,
  diamond: 2,
  square: 3,
  asterisk: 4,
  'triangle-up': 5,
  'triangle-down': 5,
  wye: 6,
  x: 6,
  plus: 1,
  rectangle: 3,
}

function toV4Symbol(marker?: ChartMarker): SymbolOptions | undefined {
  if (!marker) return
  return {
    id: symbolIds[marker.shape],
    size: marker.size,
    skip: marker.skip,
  }
}

function toV4Data(data: (SeriesData | SeriesArrayData)[]): DataPoint[] {
  // Keep FEWS flag metadata and nullable array values; the library type omits both.
  return data as unknown as DataPoint[]
}

function toV4MatrixData(
  data: ReturnType<typeof horizontalColorCodeDataFromData>,
): DataPoint[] {
  // Matrix y values are categories, which the library's DataPoint type omits.
  return data.map(
    ({ x, y, color }) => ({ x, y, color }) as unknown as DataPoint,
  )
}

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
  const reliableData = removeUnreliableData(rawData)
  const data = toV4Data(reliableData)

  const tooltip: NonNullable<ChartOptions['tooltip']> = {
    toolTipFormatter: (d) => {
      const tooltipElement = document.createElement('div')
      const yValueLabel = Array.isArray(d.y) ? d.y.join('-') : d.y
      tooltipElement.innerText = `${yValueLabel} ${chartSeries.unit}`
      return tooltipElement
    },
    anchor: TooltipAnchor.Top,
  }

  const mouseover: MouseOverOptions = {
    textFormatter: (d: DataValue, precision: number) => {
      // FEWS backend already formats the number appropriately
      return d.toString()
    },
  }

  let chart
  switch (chartSeries.type) {
    case 'dummy':
      break
    case 'line':
      chart = new ChartLine(data, { mouseover })
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
    case 'horizontalColorCode': {
      const matrixData = horizontalColorCodeDataFromData(
        chartSeries,
        reliableData,
      )
      chart = new ChartMatrix(toV4MatrixData(matrixData), {
        y: {
          paddingInner: chartSeries.barMargin,
        },
        color: {
          map: getColorMap(chartSeries.classBreaks),
        },
        tooltip,
      })
      break
    }
    default:
      chart = new V4ChartMarker(data, {
        symbol: toV4Symbol(chartSeries.marker),
        tooltip,
      })
  }
  if (chart === undefined) return
  chart.addTo(axis, chartSeries.options, id, chartSeries.style)
}

function hasMissingDataResource(
  chartSeries: ChartSeries,
  series: Record<string, Series>,
) {
  return chartSeries.dataResources.some((id) => series[id] === undefined)
}

export function refreshChart(
  axis: CartesianAxes,
  config: ChartConfig,
  series: Record<string, Series>,
) {
  /* Adds charts to the axis if not yet present, and removes charts that should no longer be there */
  const ids: Set<string> = new Set(axis.charts.map((c: any) => c.id))
  const removeIds: string[] = axis.charts.map((c: any) => c.id)
  if (config?.series === undefined) return
  for (const seriesData of config.series) {
    if (!seriesData.visibleInPlot) continue
    if (!ids.has(seriesData.id)) {
      addToChart(axis, seriesData, series)
    }
    const index = removeIds.indexOf(seriesData.id)
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
  let hasAddedChart = false
  const emptyCharts = new Set(
    axis.charts.filter(
      (chart) => chart.data === undefined || chart.data.length === 0,
    ),
  )
  chartSeries.forEach((chartSeries) => {
    const charts = axis.charts.filter((chart) => chart.id == chartSeries.id)
    if (hasMissingDataResource(chartSeries, series)) return

    if (charts.length === 0) {
      addToChart(axis, chartSeries, series)
      hasAddedChart = true
      return
    }

    const rawData = dataFromResources(chartSeries.dataResources, series)
    const reliableData = removeUnreliableData(rawData)
    const data = toV4Data(reliableData)

    const matrixData =
      chartSeries.type === 'horizontalColorCode'
        ? toV4MatrixData(
            horizontalColorCodeDataFromData(chartSeries, reliableData),
          )
        : undefined

    // Update each matching chart
    charts.forEach((chart) => {
      // Keep track of whether all charts had missing data before this data
      // update, in that case we should reset the y-axes as the domain is
      // probably [NaN, NaN].
      allMissingData &&= emptyCharts.has(chart)
      chart.data = matrixData ?? data
    })
  })
  const needsInitialScale = allMissingData || hasAddedChart
  const needsAxisRescale = needsInitialScale || hasResetAxes
  if (needsAxisRescale) {
    const options = {
      y: { autoScale: true },
      ...(needsInitialScale ? { x: { autoScale: true } } : {}),
    }
    axis.redraw(options)
  } else {
    // Ensure the current zoom, which might be user-selected, does not change
    axis.redraw({
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
