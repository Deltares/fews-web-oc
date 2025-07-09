import { ProductMetaDataType } from '@/services/useProducts/types'
import type {
  ActionRequest,
  CorrelationFilter,
  TimeSeriesDisplaySubplot,
  filterActionsFilter,
  TimeSeriesDisplaySubplotItem,
  Results,
} from '@deltares/fews-pi-requests'

export type AnalysisFunction = 'correlation'

export interface Collection {
  name: string
  settings: Settings
  charts: Chart[]
}

export interface Settings {
  startTime: Date
  endTime: Date
}

export interface BaseChart {
  id: string
  title: string
  type: string
}

export interface FilterSubplotItem extends TimeSeriesDisplaySubplotItem {
  filter: Omit<
    filterActionsFilter,
    'resamplingMethod' | 'resamplingTimeStepId'
  > & {
    moduleInstanceIds?: string
    resamplingMethods?: string
    resamplingTimeStepIds?: string
  }
  locationName?: string
  parameterGroup?: string
}

export interface FilterSubplot extends Omit<TimeSeriesDisplaySubplot, 'items'> {
  items: FilterSubplotItem[]
}

export interface FilterChart extends BaseChart {
  type: 'filter'
  requests: ActionRequest[]
  subplot: FilterSubplot
  domain?: [Date, Date]
}

export interface CorrelationChart extends BaseChart {
  type: 'correlation'
  filter: Omit<CorrelationFilter, 'startTime' | 'endTime'>
  subplot: TimeSeriesDisplaySubplot
}

export interface AsyncChart extends BaseChart {
  type: 'async'
  taskId: string
  results: Results
}

export interface ProductChart extends BaseChart {
  type: 'product'
  product: ProductMetaDataType
}

export type PlotChart = FilterChart | CorrelationChart

export type Chart =
  | FilterChart
  | CorrelationChart
  | AsyncChart
  | ProductChart
  | PlotChart

export interface CollectionEmits {
  addChart: [chart: Chart]
}
