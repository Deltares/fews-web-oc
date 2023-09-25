import type { Axis } from './types/Axis.js'
import type { ChartConfig } from './types/ChartConfig.js'
import type { ChartSeries } from './types/ChartSeries.js'
import type {
  TimeSeriesDisplaySubplot,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import {
  cssStyleFromFewsLine,
  cssStyleFromFewsMarker,
  chartMarkerFromFews,
} from './styles'

export function timeSeriesDisplayToChartConfig(
  subplot: TimeSeriesDisplaySubplot,
  title: string,
): ChartConfig {
  const config: ChartConfig = {
    title: title,
    xAxis: [],
    yAxis: yAxisFromSubplot(subplot),
  }
  const chartSeriesArray: ChartSeries[] = []
  for (const item of subplot.items) {
    if (item.lineStyle !== undefined && item.lineStyle !== 'none') {
      const chartSeries: ChartSeries = getChartSeries(item, 'line', config)
      chartSeriesArray.push(chartSeries)
    }
    if (item.markerStyle !== undefined && item.markerStyle !== 'none') {
      const chartSeries: ChartSeries = getChartSeries(item, 'marker', config)
      chartSeries.marker = chartMarkerFromFews(item.markerStyle)
      chartSeries.style = cssStyleFromFewsMarker(item)
      chartSeriesArray.push(chartSeries)
    }
    if (item.thresholds !== undefined) {
      config.thresholds = []
      for (const threshold of item.thresholds) {
        if (threshold.value === undefined) continue
        config.thresholds.push({
          id: 'Thresholds',
          x1: new Date(0),
          x2: new Date(8.64e15),
          value: threshold.value,
          description: threshold.label ?? '',
          yAxisIndex:
            config.yAxis?.findIndex((yAxis) => {
              return yAxis.location === item.yAxis?.axisPosition
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
  item: TimeSeriesDisplaySubplotItem,
  seriesType: string,
  config: ChartConfig,
) {
  return {
    id: `${item.request}`,
    dataResources: [`${item.request}`],
    name: item.legend || '',
    unit: '',
    type: seriesType,
    visibleInLegend: item.visibleInLegend,
    visibleInPlot: item.visibleInPlot,
    visibleInTable: item.visibleInTable,
    options: {
      x: {
        key: 'x',
        axisIndex: 0,
      },
      y: {
        key: 'y',
        axisIndex:
          config.yAxis?.findIndex((yAxis) => {
            return yAxis.location === item.yAxis?.axisPosition
          }) ?? 0,
      },
    },
    style: cssStyleFromFewsLine(item),
  }
}

function yAxisFromSubplot(subplot: TimeSeriesDisplaySubplot): Axis[] {
  const axes = []
  const positions = ['left', 'right']
  for (const position of positions) {
    const axisItem = subplot.items.find((item) => {
      return item.yAxis?.axisPosition === position
    })
    if (axisItem?.yAxis !== undefined) {
      const yAxis = axisItem.yAxis
      const includeZero =
        yAxis.axisMinValue === 0 && yAxis.axisMaxValue === undefined
      const axis: Axis = {
        type: 'value',
        location: position,
        label: yAxis.axisLabel,
        includeZero,
      }
      if (
        yAxis.axisMinValue !== undefined &&
        yAxis.axisMaxValue !== undefined
      ) {
        const defaultDomain = [yAxis.axisMinValue, yAxis.axisMaxValue]
        axis.defaultDomain = defaultDomain
      }
      axes.push(axis)
    }
  }
  return axes
}
