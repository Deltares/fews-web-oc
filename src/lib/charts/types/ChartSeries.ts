import * as CSS from 'csstype'
import { SymbolOptions } from '@deltares/fews-web-oc-charts'
import { ChartSeriesOptions } from './ChartSeriesOptions'

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
  style: CSS.SvgPropertiesHyphen
  editable?: boolean
  locationId?: string
}
