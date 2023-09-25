import { ChartConfig } from '../charts/types/ChartConfig.js'

export enum DisplayType {
  TimeSeriesChart = 'TimeSeriesChart',
  TimeSeriesTable = 'TimeSeriesTable',
}

export interface DisplayConfig {
  id: string
  types: DisplayType[]
  title: string
  class: string
  config: Partial<ChartConfig>
}
