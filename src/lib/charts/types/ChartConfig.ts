import { ChartSeries } from './ChartSeries'
import { ThresholdLine } from './ThresholdLine'
import { AxisOptions } from '@deltares/fews-web-oc-charts'

export interface ChartConfig {
  title: string
  xAxis?: AxisOptions[]
  yAxis?: AxisOptions[]
  radialAxis?: AxisOptions[]
  angularAxis?: AxisOptions[]
  series?: ChartSeries[]
  thresholds?: ThresholdLine[]
}
