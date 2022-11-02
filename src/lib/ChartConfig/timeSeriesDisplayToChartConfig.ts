import { ChartConfig } from "@/components/TimeSeriesComponent/lib/ChartConfig"
import { ChartSeries } from "@/components/TimeSeriesComponent/lib/ChartSeries"
import { cloneDeep } from "lodash"

export function timeSeriesDisplayToChartConfig(subplot: any, title: string): ChartConfig {
  const config: ChartConfig = {
    title: title,
    xAxis: [],
    yAxis: [{
      type: 'value',
      location: subplot.items[0].yAxis.axisPosition,
      label: subplot.items[0].yAxis.axisLabel,
    }],
  }
  const chartSeriesArray: ChartSeries[] = []
  const requestIds: string[] = []
  for (const index in subplot.items) {
    const item = subplot.items[index]
    requestIds.push(item.request)
    const count = requestIds.filter((i) => i === item.request).length
    const chartSeries = {
      id: `${item.request}[${count - 1}]`,
      dataResources: [
        `${item.request}[${count - 1}]`
      ],
      name: item.legend,
      unit: item.unit,
      type: 'line',
      options: {
        x: {
          key: "x",
          axisIndex: 0
        },
        y: {
          key: "y",
          axisIndex: 0
        },
      },
      style: {
        stroke: item.color,
        fill: "none",
        'stroke-width': item.lineWidth + 'px'
      }
    }
    chartSeriesArray.push(chartSeries)
    if (item.markerStyle !== undefined) {
      const chartSeriesClone = cloneDeep(chartSeries)
      chartSeriesClone.type = 'marker'
      chartSeriesClone.style = {
        stroke: item.color,
        fill: "none",
        'stroke-width': item.lineWidth + 'px'
      }
      chartSeriesArray.push(chartSeriesClone)
    }
  }
  config.series = chartSeriesArray
  return config
}
