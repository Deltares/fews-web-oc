import { ChartConfig } from "@/components/TimeSeriesComponent/lib/ChartConfig"
import { ChartSeries } from "@/components/TimeSeriesComponent/lib/ChartSeries"
import { cssLineStyleFromFEWS, chartMarkerFromFEWS as chartMarkerFromFEWS } from "./Styles"

export function timeSeriesDisplayToChartConfig(subplot: any, title: string): ChartConfig {
  const yAxis = subplot.items[0].yAxis
  const config: ChartConfig = {
    title: title,
    xAxis: [],
    yAxis: [{
      type: 'value',
      location: yAxis.axisPosition,
      label: yAxis.axisLabel,
      defaultDomain: [yAxis.axisMinValue, yAxis.axisMaxValue]
    }],
  }
  const chartSeriesArray: ChartSeries[] = []
  for (const index in subplot.items) {
    const item = subplot.items[index]
    const chartSeries = {
      id: `${item.request}`,
      dataResources: [
        `${item.request}`
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
        ...cssLineStyleFromFEWS(item.lineStyle),
        stroke: item.color,
      },
    }
    chartSeriesArray.push(chartSeries)
    if (item.markerStyle !== undefined && item.markerStyle !== "none") {
      const chartSeriesClone = structuredClone(chartSeries)
      chartSeriesClone.type = 'marker'
      chartSeriesClone.style = {
        stroke: item.color,
        fill: item.color,
        'stroke-width': item.lineWidth + 'px',
      }
      chartSeriesClone.marker = chartMarkerFromFEWS(item.markerStyle)
      chartSeriesArray.push(chartSeriesClone)
    }
  }
  config.series = chartSeriesArray
  return config
}
