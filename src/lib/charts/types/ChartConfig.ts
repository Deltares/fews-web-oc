import type { ChartSeries } from './ChartSeries'
import type {
  AxisOptions,
  AlertLineOptions,
} from '@deltares/fews-web-oc-charts'

export interface ChartConfig {
  id: string
  title: string
  xAxis?: AxisOptions[]
  yAxis?: AxisOptions[]
  radialAxis?: AxisOptions[]
  angularAxis?: AxisOptions[]
  series: ChartSeries[]
  thresholds?: AlertLineOptions[]
}
