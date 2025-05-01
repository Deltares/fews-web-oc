import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ActionRequest } from '@deltares/fews-pi-requests'
import { hisFunctionToGenerator } from './functions'

type HisFunction = keyof typeof hisFunctionToGenerator

export interface Collection {
  name: string
  charts: Chart[]
}

export interface BaseChart {
  id: string
  title: string
  config: ChartConfig
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
