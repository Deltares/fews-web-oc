import { ChartConfig } from '../charts/types/ChartConfig.js'
import { ActionPeriod, ActionRequest } from '@deltares/fews-pi-requests'

export enum DisplayType {
  TimeSeriesChart = 'timeSeriesChart',
  TimeSeriesTable = 'timeSeriesTable',
  ElevationChart = 'elevationChart',
  Information = 'information',
  Unknown = '',
}

export interface DisplayConfig {
  id: string
  nodeId: string | undefined
  plotId: string | undefined
  index: number | undefined
  title: string
  forecastLegend: string | undefined
  class: string
  requests: ActionRequest[]
  period: ActionPeriod | undefined
  subplots: ChartConfig[]
}
