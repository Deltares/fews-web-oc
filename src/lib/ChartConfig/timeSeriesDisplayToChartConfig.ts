import { Axis } from "@/components/TimeSeriesComponent/lib/Axis"
import { ChartConfig } from "@/components/TimeSeriesComponent/lib/ChartConfig.js"
import { ChartSeries } from "@/components/TimeSeriesComponent/lib/ChartSeries.js"
import { cssStyleFromFewsLine, cssStyleFromFewsMarker, chartMarkerFromFews } from "./Styles"
import { TimeSeriesDisplaySubplot, TimeSeriesDisplaySubplotItem } from "../TimeSeries/types"

export function timeSeriesDisplayToChartConfig(subplot: TimeSeriesDisplaySubplot, title: string): ChartConfig {
  const config: ChartConfig = {
    title: title,
    xAxis: xAxisFromSubplot(subplot),
    yAxis: yAxisFromSubplot(subplot),
  }
  const chartSeriesArray: ChartSeries[] = []
  for (const item of subplot.items) {
    if (item.lineStyle !== undefined && item.lineStyle !== "none") {
      const chartSeries: ChartSeries = getChartSeries(item, "line", config)
      chartSeriesArray.push(chartSeries)
    }
    if (item.markerStyle !== undefined && item.markerStyle !== "none") {
      const chartSeries: ChartSeries = getChartSeries(item, "marker", config)
      chartSeries.marker = chartMarkerFromFews(item.markerStyle)
      chartSeries.style = cssStyleFromFewsMarker(item)
      chartSeriesArray.push(chartSeries)
    }
    if (item.thresholds !== undefined){
      config.thresholds = []
      for (const threshold of item.thresholds) {
        if (threshold.value === undefined) continue
        config.thresholds.push({
          id: "Thresholds",
          x1: new Date(0),
          x2: new Date(8.64e15),
          value: threshold.value,
          description: threshold.label ?? '',
          yAxisIndex: config.yAxis?.findIndex((yAxis) => {
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

function getChartSeries(item: TimeSeriesDisplaySubplotItem, seriesType: string, config: ChartConfig) {
  return {
    id: `${item.request}${item.sequence !== undefined ? `-${item.sequence}` : ''}`,
    dataResources: [`${item.request}${item.sequence !== undefined ? `-${item.sequence}` : ''}`,],
    sequence: item.sequence,
    name: item.legend || "",
    unit: "",
    type: seriesType,
    visibleInLegend: item.visibleInLegend,
    visibleInPlot: item.visibleInPlot,
    visibleInTable: item.visibleInTable,
    options: {
      x: {
        key: "x",
        axisIndex: 0
      },
      y: {
        key: "y",
        axisIndex: config.yAxis?.findIndex((yAxis) => {
          return yAxis.location === item.yAxis?.axisPosition
        }) ?? 0
      },
    },
    style: cssStyleFromFewsLine(item),
  }
}

function yAxisFromSubplot(subplot: TimeSeriesDisplaySubplot): Axis[] {
  const axes = []
  const positions = ["left", "right"]
  for (const position of positions) {
    const axisItem = subplot.items.find((item) => {
      return item.yAxis?.axisPosition === position
    })
    if (axisItem?.yAxis !== undefined) {
      const yAxis = axisItem.yAxis
      const includeZero = yAxis.axisMinValue === 0 && yAxis.axisMaxValue === undefined

      // TODO: yAxis.axisType should instead be set in yAxis: TimeSeriesDisplaySubplotItemAxis
      const isDegrees = yAxis.axisLabel?.includes("degrees") &&
        yAxis.axisMinValue === 0 &&
        yAxis.axisMaxValue === 360

      const axis: Axis = {
        type: isDegrees ? "degrees" : "value",
        location: position,
        label: yAxis.axisLabel,
        includeZero
      }
      if (yAxis.axisMinValue !== undefined && yAxis.axisMaxValue !== undefined) {
        const defaultDomain = [
          yAxis.axisMinValue,
          yAxis.axisMaxValue
        ]
        axis.defaultDomain = defaultDomain
      }
      axes.push(axis)
    }
  }
  return axes
}

function xAxisFromSubplot(subplot: TimeSeriesDisplaySubplot): Axis[] {
  const xAxis = subplot.xAxis
  if (xAxis === undefined) return []
  const includeZero = xAxis.axisMinValue === 0 && xAxis.axisMaxValue === undefined

  // TODO: xAxis.axisType should instead be set in xAxis: TimeSeriesDisplaySubplotItemAxis
  const isDegrees = xAxis.axisLabel?.includes("degrees") &&
    xAxis.axisMinValue === 0 &&
    xAxis.axisMaxValue === 360

  const axis: Axis = {
    type: isDegrees ? "degrees" : "value",
    label: xAxis.axisLabel,
    location: "bottom",
    includeZero
  }
  if (xAxis.axisMinValue !== undefined && xAxis.axisMaxValue !== undefined) {
    const defaultDomain = [
      xAxis.axisMinValue,
      xAxis.axisMaxValue
    ]
    axis.defaultDomain = defaultDomain
  }
  return [axis]
}
