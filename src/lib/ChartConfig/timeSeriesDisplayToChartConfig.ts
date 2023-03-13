import { Axis } from "@/components/TimeSeriesComponent/lib/Axis"
import { ChartConfig } from "@/components/TimeSeriesComponent/lib/ChartConfig.js"
import { ChartSeries } from "@/components/TimeSeriesComponent/lib/ChartSeries.js"
import { cssStyleFromFewsLine, cssStyleFromFewsMarker, chartMarkerFromFews } from "./Styles"

export function timeSeriesDisplayToChartConfig(subplot: any, title: string): ChartConfig {
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
        name: item.legend,
        unit: item.unit,
        type: "line",
        options: {
          x: {
            key: "x",
            axisIndex: 0
          },
          y: {
            key: "y",
            axisIndex: config.yAxis?.findIndex((yAxis: any) => {
              return yAxis.location === item.yAxis.axisPosition
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
        name: item.legend,
        unit: item.unit,
        type: "marker",
        options: {
          x: {
            key: "x",
            axisIndex: 0
          },
          y: {
            key: "y",
            axisIndex: config.yAxis?.findIndex((yAxis: any) => {
              return yAxis.location === item.yAxis.axisPosition
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

function yAxisFromSubplot(subplot: any): Axis[] {
  const axes = []
  const positions = ["left", "right"]
  for (const position of positions) {
    const axisItem = subplot.items.find((item: any) => {
      return item.yAxis.axisPosition === position
    })
    if (axisItem !== undefined) {
      axes.push({
        type: "value",
        location: axisItem.yAxis.axisPosition,
        label: axisItem.yAxis.axisLabel,
        defaultDomain: [
          axisItem.yAxis.axisMinValue,
          axisItem.yAxis.axisMaxValue,
        ],
      })
    }
  }
  return axes
}
