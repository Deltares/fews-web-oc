import type { ChartConfig } from './types/ChartConfig.js'
import type { ChartSeries } from './types/ChartSeries.js'
import type {
  TimeSeriesDisplayPlotItemXAxis,
  TimeSeriesDisplaySubplot,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import {
  cssStyleFromFewsArea,
  cssStyleFromFewsLine,
  cssStyleFromFewsMarker,
  chartMarkerFromFews,
  cssStyleFromFewsBar,
} from './styles'
import {
  AxisOptions,
  AxisPosition,
  AxisType,
} from '@deltares/fews-web-oc-charts'

const MAX_MILLISECONDS_FROM_EPOCH = 8.64e15

export function timeSeriesDisplayToChartConfig(
  subplot: TimeSeriesDisplaySubplot,
): ChartConfig {
  const xAxis = subplot.xAxis ? xAxisFromPlotItemXAxis(subplot.xAxis) : []
  const subplotId = subplot.items.map((plot) => plot.request).toString()

  const config: ChartConfig = {
    id: subplotId,
    title: '',
    xAxis,
    yAxis: yAxisFromSubplot(subplot),
    series: [],
  }

  const chartSeriesArray = generateChartSeriesArray(subplot, config)
  config.series = chartSeriesArray

  return config
}

function generateChartSeriesArray(
  subplot: TimeSeriesDisplaySubplot,
  config: ChartConfig,
): ChartSeries[] {
  const chartSeriesArray: ChartSeries[] = []
  const areaLegendLabels: string[] = []

  for (const [index, item] of subplot.items.entries()) {
    if (item.type === 'area' && item.legend) {
      handleAreaType(item, index, subplot, areaLegendLabels, chartSeriesArray, config)
    } else if (item.type === 'horizontalColorCode') {
      handleHorizontalColorCodeType(item, chartSeriesArray, config)
    } else if (item.type === 'line' && isValidLineStyle(item.lineStyle)) {
      handleLineType(item, chartSeriesArray, config)
    } else if (isValidMarkerStyle(item.markerStyle)) {
      handleMarkerType(item, chartSeriesArray, config)
    }
  }

  return chartSeriesArray
}

function handleAreaType(
  item: TimeSeriesDisplaySubplotItem,
  index: number,
  subplot: TimeSeriesDisplaySubplot,
  areaLegendLabels: string[],
  chartSeriesArray: ChartSeries[],
  config: ChartConfig,
) {
  if (!item.legend) return
  if (areaLegendLabels.includes(item.legend)) {
    const chartSeries = getChartSeries([item], 'dummy', config)
    chartSeriesArray.push(chartSeries)
    return
  }

  areaLegendLabels.push(item.legend)
  const secondItemIndex = subplot.items.findLastIndex(
    (i) => i.legend === item.legend,
  )
  const chartType = item.lineStyle === undefined ? 'area' : 'rule'
  const secondItem = subplot.items[secondItemIndex]
  const items = secondItemIndex === index ? [item] : [item, secondItem]

  const chartSeries = getChartSeries(items, chartType, config)
  chartSeriesArray.push(chartSeries)
}

function handleHorizontalColorCodeType(
  item: TimeSeriesDisplaySubplotItem,
  chartSeriesArray: ChartSeries[],
  config: ChartConfig,
) {
  const chartSeries: ChartSeries = getChartSeries(
    [item],
    'horizontalColorCode',
    config,
  )
  chartSeriesArray.unshift(chartSeries)
}

function handleLineType(
  item: TimeSeriesDisplaySubplotItem,
  chartSeriesArray: ChartSeries[],
  config: ChartConfig,
) {
  const chartType =
    item.lineStyle === 'area' || item.lineStyle === 'bar'
      ? item.lineStyle
      : 'line'
  const chartSeries: ChartSeries = getChartSeries([item], chartType, config)
  chartSeriesArray.push(chartSeries)
}

function handleMarkerType(
  item: TimeSeriesDisplaySubplotItem,
  chartSeriesArray: ChartSeries[],
  config: ChartConfig,
) {
  const chartSeries: ChartSeries = getChartSeries([item], 'marker', config)
  if (item.markerStyle === undefined) return
  chartSeries.marker = chartMarkerFromFews(item.markerStyle, item.markerSize)
  chartSeries.style = cssStyleFromFewsMarker(item)
  chartSeriesArray.push(chartSeries)
}

function isValidLineStyle(lineStyle?: string): boolean {
  return lineStyle !== undefined && !lineStyle.startsWith('none')
}

function isValidMarkerStyle(markerStyle?: string): boolean {
  return markerStyle !== undefined && markerStyle !== 'none'
}

function getChartSeries(
  items: TimeSeriesDisplaySubplotItem[],
  seriesType: ChartSeries['type'],
  config: ChartConfig,
): ChartSeries {
  return {
    id: `${items[0].request}`,
    dataResources: items.map((item) => `${item.request}`),
    name: items[0].legend || '',
    unit: '',
    type: seriesType,
    visibleInLegend: items[0].visibleInLegend,
    visibleInPlot: items[0].visibleInPlot,
    visibleInTable: items[0].visibleInTable,
    locationId: items[0].locationId,
    classBreaks: items[0].classBreaks,
    barMargin: items[0].barMargin,
    options: getChartOptions(seriesType, items[0], config),
    style: getChartStyle(seriesType, items[0]),
    thresholds: getThresholdLinesFromItem(items[0], config),
    thresholdAxisScaling: items[0].thresholdAxisScaling,
  }
}

function getThresholdLinesFromItem(
  item: TimeSeriesDisplaySubplotItem,
  config: ChartConfig,
) {
  if (item.type === 'horizontalColorCode') return []
  if (item.thresholds === undefined) return []
  const yAxisIndex = config.yAxis?.findIndex(
    (yAxis) => yAxis.position === item.yAxis?.axisPosition,
  )
  return item.thresholds.flatMap((threshold) => {
    if (threshold.value === undefined) return []
    return {
      id: 'Thresholds',
      x1: new Date(-MAX_MILLISECONDS_FROM_EPOCH),
      x2: new Date(MAX_MILLISECONDS_FROM_EPOCH),
      value: threshold.value,
      description: threshold.label ?? '',
      labelPosition: threshold.labelAlignment,
      yAxisIndex: yAxisIndex ?? 0,
      color: threshold.color ?? item.color ?? 'currentColor',
    }
  })
}

function getChartOptions(
  seriesType: ChartSeries['type'],
  item: TimeSeriesDisplaySubplotItem,
  config: ChartConfig,
) {
  const yAxisIndex = config.yAxis?.findIndex(
    (yAxis) => yAxis.position === item.yAxis?.axisPosition,
  )
  const result: ChartSeries['options'] = {
    x: {
      key: 'x',
      axisIndex: 0,
    },
    y: {
      key: 'y',
      axisIndex: yAxisIndex ?? 0,
    },
  }

  if (seriesType === 'horizontalColorCode') {
    result.color = {
      key: 'color',
    }
  }

  return result
}

function getChartStyle(
  seriesType: ChartSeries['type'],
  item: TimeSeriesDisplaySubplotItem,
) {
  switch (seriesType) {
    case 'area':
      return cssStyleFromFewsArea(item)
    case 'bar':
    case 'horizontalColorCode':
      return cssStyleFromFewsBar(item)
    default:
      return cssStyleFromFewsLine(item)
  }
}

function xAxisFromPlotItemXAxis(
  xAxis: TimeSeriesDisplayPlotItemXAxis,
): AxisOptions[] {
  const axes = []
  const includeZero =
    xAxis.axisMinValue === 0 && xAxis.axisMaxValue === undefined

  // TODO: xAxis.axisType should instead be set in xAxis: TimeSeriesDisplaySubplotItemAxis
  const isDegrees =
    xAxis.axisLabel?.includes('degrees') &&
    xAxis.axisMinValue === 0 &&
    xAxis.axisMaxValue === 360

  const axis: AxisOptions = {
    type: isDegrees ? AxisType.degrees : AxisType.value,
    label: xAxis.axisLabel,
    includeZero,
  }
  if (xAxis.axisMinValue !== undefined && xAxis.axisMaxValue !== undefined) {
    const defaultDomain: [number, number] = [
      xAxis.axisMinValue,
      xAxis.axisMaxValue,
    ]
    axis.defaultDomain = defaultDomain
  }
  axes.push(axis)
  return axes
}

function yAxisFromSubplot(subplot: TimeSeriesDisplaySubplot): AxisOptions[] {
  const axes: AxisOptions[] = []
  const positions = [AxisPosition.Left, AxisPosition.Right]
  for (const position of positions) {
    const axisItem = subplot.items.find(
      (item) => item.yAxis?.axisPosition === position,
    )
    if (axisItem?.yAxis === undefined) continue
    const yAxis = axisItem?.yAxis

    if (axisItem.type === 'horizontalColorCode') {
      axes.push({
        type: AxisType.band,
        position,
        label: yAxis.axisLabel,
      })
      addHorizontalColorCodeLegendItems(subplot)
      continue
    }

    const includeZero =
      yAxis.axisMinValue === 0 && yAxis.axisMaxValue === undefined
    const axis: AxisOptions = {
      type: AxisType.value,
      position,
      label: yAxis.axisLabel,
      includeZero,
      reverse: axisItem.inverted,
    }
    if (yAxis.axisMinValue !== undefined && yAxis.axisMaxValue !== undefined) {
      const domain: [number, number] = [yAxis.axisMinValue, yAxis.axisMaxValue]
      if (yAxis.axisMinValue === 0 && yAxis.axisMaxValue === 360) {
        axis.type = AxisType.degrees
        axis.domain = domain
        axis.nice = false
      } else {
        axis.defaultDomain = domain
      }
    }
    axes.push(axis)
  }
  return axes
}

function addHorizontalColorCodeLegendItems(subplot: TimeSeriesDisplaySubplot) {
  const parameters: string[] = []

  // Replace parameter names in the legend with indices
  subplot.items.forEach((item) => {
    const split = item.legend?.split(' - ')
    const location = split?.[0]
    const parameter = split?.[1]
    if (!location || !parameter) return

    let parameterIndex = parameters.indexOf(parameter)
    if (parameterIndex === -1) {
      parameters.push(parameter)
      parameterIndex = parameters.length - 1
    }

    item.legend = `${location} [${parameterIndex}]`
  })

  const parameterLegendItems = parameters
    .map((parameter, index) => `[${index}] ${parameter}`)
    .map((legend) => {
      const item: TimeSeriesDisplaySubplotItem = {
        type: 'line',
        legend,
        visibleInLegend: true,
        visibleInPlot: false,
        visibleInTable: false,
        lineStyle: 'invalid',
      }
      return item
    })

  subplot.items.push(...parameterLegendItems)
}
