import type { SvgPropertiesHyphen } from 'csstype'
import type { SymbolOptions } from '@deltares/fews-web-oc-charts'
import type { ChartSeriesOptions } from './ChartSeriesOptions'

export interface ChartSeries {
  id: string
  dataResources: string[]
  name: string
  visibleInPlot: boolean
  visibleInLegend: boolean
  visibleInTable: boolean
  label?: string
  marker?: SymbolOptions
  type: string
  options: ChartSeriesOptions
  unit: string
  style: SvgPropertiesHyphen
}
