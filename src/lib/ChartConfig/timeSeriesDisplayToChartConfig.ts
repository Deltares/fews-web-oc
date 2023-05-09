import { Axis } from "@/components/TimeSeriesComponent/lib/Axis"
import { ChartConfig } from "@/components/TimeSeriesComponent/lib/ChartConfig.js"
import { ChartSeries } from "@/components/TimeSeriesComponent/lib/ChartSeries.js"
import { TimeSeriesDisplaySubplot } from "@deltares/fews-pi-requests"
import { cssStyleFromFewsLine, cssStyleFromFewsMarker, chartMarkerFromFews } from "./Styles"

export function timeSeriesDisplayToChartConfig(subplot: TimeSeriesDisplaySubplot, title: string): ChartConfig {
  const config: ChartConfig = {
    title: title,
    xAxis: [],
    yAxis: yAxisFromSubplot(subplot),
  }
  const chartSeriesArray: ChartSeries[] = []
  for (const item of subplot.items) {
    if (item.lineStyle !== undefined && item.lineStyle !== "none") {
      const chartSeries = {
        id: `${item.request}`,
        dataResources: [`${item.request}`],
        name: item.legend || "",
        unit: "",
        type: "line",
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
      chartSeriesArray.push(chartSeries)
    }
    if (item.markerStyle !== undefined && item.markerStyle !== "none") {
      const chartSeries = {
        id: `${item.request}`,
        dataResources: [`${item.request}`],
        name: item.legend || "",
        unit: "",
        type: "marker",
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
        style: cssStyleFromFewsMarker(item),
        marker: chartMarkerFromFews(item.markerStyle)
      }
      chartSeriesArray.push(chartSeries)
    }
  }
  config.series = chartSeriesArray
  return config
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
      const axis: Axis = {
        type: "value",
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
