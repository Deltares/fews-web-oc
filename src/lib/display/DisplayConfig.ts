import { ChartConfig } from '../charts/types/ChartConfig.js'

export enum DisplayType {
  TimeSeriesChart = 'TimeSeriesChart',
  TimeSeriesTable = 'TimeSeriesTable',
}

export interface DisplayConfig {
  id: string
  title: string
  class: string
  requests: any[]
  subplots: ChartConfig[]
}
