import type {
  ActionRequest,
  filterActionsFilter,
  CorrelationFilter,
  TimeSeriesDisplaySubplot,
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

export type Chart = FilterChart | CorrelationChart

export interface Dependant {
  seriesIds: string[]
  function: AnalysisFunction
}

export interface CollectionEmits {
  addFilter: [addFilter: AddFilter]
  addChart: [chart: Chart]
}

export interface AddFilter {
  filter: filterActionsFilter
  titlePrefix?: string
}
