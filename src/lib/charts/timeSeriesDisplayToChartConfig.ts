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

export function timeSeriesDisplayToChartConfig(
  subplot: TimeSeriesDisplaySubplot,
  domain?: [Date, Date],
): ChartConfig {
  const xAxis = subplot.xAxis ? xAxisFromPlotItemXAxis(subplot.xAxis) : []
  if (domain) {
    // Set the domain of the x-axis to be equal to the period, even if there are
    // no data points in parts of the period.
    if (xAxis.length === 0) {
      xAxis.push({ domain })
    } else {
      // Time series charts always have just a single x-axis.
      xAxis[0].domain = domain
    }
  }

  const subplotId = subplot.items.map((plot) => plot.request).toString()
  const config: ChartConfig = {
    id: subplotId,
    title: '',
    xAxis,
    yAxis: yAxisFromSubplot(subplot),
    series: [],
  }
  const chartSeriesArray: ChartSeries[] = []
  config.thresholds = []

  const legendLabels: string[] = []
  const thresholdIds: string[] = []
  for (const item of subplot.items) {
    if (item.legend && legendLabels.includes(item.legend)) {
      // Create second item as dummy for item.type 'area'
      const chartSeries: ChartSeries = getChartSeries([item], 'dummy', config)
      chartSeriesArray.push(chartSeries)
      continue
    }
    if (item.legend) legendLabels.push(item.legend)
    if (item.type === 'area') {
      // Area has two data resources
      const secondItemIndex = subplot.items.findLastIndex(
        (i) => i.legend === item.legend,
      )
      if (secondItemIndex > -1) {
        const secondItem = subplot.items[secondItemIndex]
        const chartType = item.lineStyle === undefined ? 'area' : 'rule'
        const chartSeries: ChartSeries = getChartSeries(
          [item, secondItem],
          chartType,
          config,
        )
        chartSeriesArray.push(chartSeries)
      }
    }

    if (item.type === 'horizontalColorCode') {
      const chartSeries: ChartSeries = getChartSeries(
        [item],
        'horizontalColorCode',
        config,
      )
      chartSeriesArray.push(chartSeries)
    }

    if (
      item.type === 'line' &&
      item.lineStyle !== undefined &&
      item.lineStyle !== 'none'
    ) {
      const chartSeries: ChartSeries = getChartSeries(
        [item],
        item.lineStyle === 'area' || item.lineStyle === 'bar'
          ? item.lineStyle
          : 'line',
        config,
      )
      chartSeriesArray.push(chartSeries)
    }

    if (item.markerStyle !== undefined && item.markerStyle !== 'none') {
      const chartSeries: ChartSeries = getChartSeries([item], 'marker', config)
      chartSeries.marker = chartMarkerFromFews(item.markerStyle)
      chartSeries.style = cssStyleFromFewsMarker(item)
      chartSeriesArray.push(chartSeries)
    }

    if (item.thresholds !== undefined) {
      for (const threshold of item.thresholds) {
        if (threshold.value === undefined) continue
        const thresholdId = `${threshold.label}-${threshold.value}`
        if (thresholdIds.includes(thresholdId)) continue
        thresholdIds.push(thresholdId)
        config.thresholds.push({
          id: 'Thresholds',
          x1: new Date(0),
          x2: new Date(8.64e15),
          value: threshold.value,
          description: threshold.label ?? '',
          yAxisIndex:
            config.yAxis?.findIndex((yAxis) => {
              return yAxis.position === item.yAxis?.axisPosition
            }) ?? 0,
          color: threshold.color ?? item.color ?? 'currentColor',
        })
      }
    }
  }
  config.series = chartSeriesArray
  return config
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
  }
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
