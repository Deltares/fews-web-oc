import * as CSS from 'csstype'
import { SymbolOptions } from '@deltares/fews-web-oc-charts'
import { ChartSeriesOptions } from './ChartSeriesOptions'
import { TimeSeriesDisplaySubplotItem } from '@deltares/fews-pi-requests'
import { ThresholdLine } from './ThresholdLine'

type ChartSeriesType =
  | TimeSeriesDisplaySubplotItem['type']
  | 'rule'
  | 'bar'
  | 'marker'
  | 'dummy'

type SubplotItem = Pick<
  TimeSeriesDisplaySubplotItem,
  | 'classBreaks'
  | 'barMargin'
  | 'visibleInLegend'
  | 'visibleInPlot'
  | 'visibleInTable'
>

export interface ChartSeries extends SubplotItem {
  id: string
  dataResources: string[]
  name: string
  label?: string
  marker?: SymbolOptions
  type: ChartSeriesType
  options: ChartSeriesOptions
  unit: string
  style: CSS.SvgPropertiesHyphen
  editable?: boolean
  locationId?: string
  thresholds?: ThresholdLine[]
  thresholdAxisScaling?: TimeSeriesDisplaySubplotItem['thresholdAxisScaling']
}
