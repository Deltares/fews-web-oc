import type {
  ActionRequest,
  TimeSeriesDisplaySubplot,
} from '@deltares/fews-pi-requests'

export type HisFunction = 'correlation'

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

export interface DerivedChart extends BaseChart {
  type: 'derived'
  dependants: Dependant[]
}

export type Chart = FilterChart | DerivedChart

export interface Dependant {
  seriesIds: string[]
  function: HisFunction
}
