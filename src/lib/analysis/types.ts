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

export interface DisplayCollections {
  version?: '1.0'
  collections: Collection[]
}

export interface Collection {
  name: string
  settings: Settings
  charts: Chart[]
}

export interface Settings {
  startTime: Date
  endTime: Date
  liveUpdate: {
    enabled: boolean
    daysBeforeNow: number
    daysAfterNow: number
  }
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
  timeSeriesNameYAxis: string
  timeSeriesNameXAxis: string
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

export function validateDisplayCollections(data: DisplayCollections): boolean {
  if (data.version && data.version !== '1.0') {
    console.error("Version must be '1.0' if provided")
    return false
  }

  if (!Array.isArray(data.collections)) {
    console.error('Collections must be an array')
    return false
  }

  data.collections.forEach((collection, index) => {
    if (typeof collection.name !== 'string') {
      console.error(`Collection at index ${index} must have a string name`)
      return false
    }

    const settings = collection.settings
    if (
      !settings ||
      !(settings.startTime instanceof Date) ||
      !(settings.endTime instanceof Date)
    ) {
      console.error(
        `Collection at index ${index} must have valid startTime and endTime`,
      )
      return false
    }

    const liveUpdate = settings.liveUpdate
    if (
      !liveUpdate ||
      typeof liveUpdate.enabled !== 'boolean' ||
      typeof liveUpdate.daysBeforeNow !== 'number' ||
      typeof liveUpdate.daysAfterNow !== 'number'
    ) {
      console.error(
        `Collection at index ${index} must have valid liveUpdate settings`,
      )
      return false
    }

    if (!Array.isArray(collection.charts)) {
      console.error(`Collection at index ${index} must have an array of charts`)
      return false
    }

    collection.charts.forEach((chart, chartIndex) => {
      if (
        typeof chart.id !== 'string' ||
        typeof chart.title !== 'string' ||
        typeof chart.type !== 'string'
      ) {
        console.error(
          `Chart at index ${chartIndex} in collection ${index} must have valid id, title, and type`,
        )
        return false
      }
    })
  })

  return true
}
