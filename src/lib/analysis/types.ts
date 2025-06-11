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
  subplot: TimeSeriesDisplaySubplot
}

export interface FilterChart extends BaseChart {
  type: 'filter'
  requests: ActionRequest[]
}

export interface CorrelationChart extends BaseChart {
  type: 'correlation'
  timeSeriesNameYAxis: string
  timeSeriesNameXAxis: string
  filter: Omit<CorrelationFilter, 'startTime' | 'endTime'>
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

export type Chart = FilterChart | CorrelationChart | AsyncChart | ProductChart

export interface Dependant {
  seriesIds: string[]
  function: AnalysisFunction
}

export interface CollectionEmits {
  addChart: [chart: Chart]
}
