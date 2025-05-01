import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ActionRequest } from '@deltares/fews-pi-requests'
import { Series } from '../timeseries/timeSeries'

export interface Collection {
  name: string
  charts: Chart[]
}

export interface Chart {
  title: string
  config: ChartConfig
  requests: ActionRequest[]
  dependants: Dependant[]
}

export interface Dependant {
  seriesIds: string[]
  generateSeries: (series: Record<string, Series>) => Record<string, Series>
}
