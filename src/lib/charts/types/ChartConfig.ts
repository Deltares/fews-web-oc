import { ChartSeries } from './ChartSeries'
import { Axis } from './Axis'
import { ThresholdLine } from './ThresholdLine'

export interface ChartConfig {
  title: string
  xAxis?: Axis[]
  yAxis?: Axis[]
  radialAxis?: Axis[]
  angularAxis?: Axis[]
  series?: ChartSeries[]
  thresholds?: ThresholdLine[]
}
