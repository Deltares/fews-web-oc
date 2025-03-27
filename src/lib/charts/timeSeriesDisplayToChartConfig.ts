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
          color: threshold.color ?? item.color,
        })
      }
    }
  }
  config.series = chartSeriesArray
  return config
}

function getChartSeries(
  items: TimeSeriesDisplaySubplotItem[],
  seriesType: string,
  config: ChartConfig,
) {
  return {
    id: `${items[0].request}`,
    dataResources: items.map((item) => `${item.request}`),
    name: items[0].legend || '',
    unit: '',
    type: seriesType,
    visibleInLegend: items[0].visibleInLegend,
    visibleInPlot: items[0].visibleInPlot,
    visibleInTable: items[0].visibleInTable,
    options: {
      x: {
        key: 'x',
        axisIndex: 0,
      },
      y: {
        key: 'y',
        axisIndex:
          config.yAxis?.findIndex((yAxis) => {
            return yAxis.position === items[0].yAxis?.axisPosition
          }) ?? 0,
      },
    },
    style:
      seriesType === 'area' || seriesType === 'bar'
        ? cssStyleFromFewsArea(items[0])
        : cssStyleFromFewsLine(items[0]),
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
  const axes = []
  const positions = [AxisPosition.Left, AxisPosition.Right]
  for (const position of positions) {
    const axisItem = subplot.items.find((item) => {
      return item.yAxis?.axisPosition === position
    })
    if (axisItem?.yAxis !== undefined) {
      const yAxis = axisItem.yAxis
      const includeZero =
        yAxis.axisMinValue === 0 && yAxis.axisMaxValue === undefined
      const axis: AxisOptions = {
        type: AxisType.value,
        position,
        label: yAxis.axisLabel,
        includeZero,
      }
      if (
        yAxis.axisMinValue !== undefined &&
        yAxis.axisMaxValue !== undefined
      ) {
        const domain: [number, number] = [
          yAxis.axisMinValue,
          yAxis.axisMaxValue,
        ]
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
  }
  return axes
}
