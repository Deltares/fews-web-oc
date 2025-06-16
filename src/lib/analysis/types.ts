import { ProductMetaDataType } from '@/services/useProducts/types'
import type {
  ActionRequest,
  CorrelationFilter,
  TimeSeriesDisplaySubplot,
  ArchiveProductsMetadataAttribute,
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

export interface FilterChart extends BaseChart {
  type: 'filter'
  filterId: string
  requests: ActionRequest[]
  subplot: TimeSeriesDisplaySubplot
  forecastLegend?: string
}

export interface CorrelationChart extends BaseChart {
  type: 'correlation'
  timeSeriesNameYAxis: string
  timeSeriesNameXAxis: string
  filter: Omit<CorrelationFilter, 'startTime' | 'endTime'>
  subplot: TimeSeriesDisplaySubplot
  forecastLegend?: string
}

interface ArchiveProduct {
  id?: string
  name?: string
  areaId: string
  sourceId?: string
  versionKeys?: string[]
  attributes?: ArchiveProductsMetadataAttribute[]
}

interface Result {
  filterId?: string
  archiveProduct?: ArchiveProduct
}

export interface AsyncChart extends BaseChart {
  type: 'async'
  taskId: string
  result: Result
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

export interface Dependant {
  seriesIds: string[]
  function: AnalysisFunction
}

export interface CollectionEmits {
  addChart: [chart: Chart]
}
