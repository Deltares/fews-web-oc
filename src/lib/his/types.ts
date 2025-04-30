import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ActionRequest } from '@deltares/fews-pi-requests'

export interface Collection {
  name: string
  charts: Chart[]
}

export interface Chart {
  title: string
  config: ChartConfig
  requests: ActionRequest[]
}
