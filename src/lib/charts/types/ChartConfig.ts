import type { ChartSeries } from './ChartSeries'
import type { ChartAxis } from './ChartAxis'

export interface ChartConfig {
  id: string
  title: string
  xAxis?: ChartAxis[]
  yAxis?: ChartAxis[]
  radialAxis?: ChartAxis[]
  angularAxis?: ChartAxis[]
  series: ChartSeries[]
  plotWeight?: number
}
