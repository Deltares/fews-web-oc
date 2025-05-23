import { ChartConfig } from '../charts/types/ChartConfig.js'
import { ActionPeriod, ActionRequest } from '@deltares/fews-pi-requests'

export enum DisplayType {
  TimeSeriesChart = 'TimeSeriesChart',
  TimeSeriesTable = 'TimeSeriesTable',
  ElevationChart = 'ElevationChart',
  Information = 'Information',
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
