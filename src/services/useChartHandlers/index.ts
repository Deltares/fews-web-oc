import { inject, provide } from 'vue'
import type { ChartGroup } from '@/lib/charts/types/TimeSeriesChartProps'
import { createV4ChartGroup } from './v4'
import { createV5ChartGroup } from './v5'

const CHART_HANDLERS_KEY = Symbol('chartHandlers')

export function provideChartHandlers(): ChartGroup {
  const group = createChartHandlersGroup()
  provide(CHART_HANDLERS_KEY, group)
  return group
}

export function useChartHandlers(): ChartGroup {
  const fallbackGroup = createChartHandlersGroup()
  return inject(CHART_HANDLERS_KEY, fallbackGroup)
}

export function createChartHandlersGroup(): ChartGroup {
  const { group } = createV4ChartGroup()
  group.v5 = createV5ChartGroup()
  return group
}
