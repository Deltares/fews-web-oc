import { inject, provide } from 'vue'
import type { ChartGroup } from '@/lib/charts/types/TimeSeriesChartProps'
import { createV4ChartGroup } from './v4'

const CHART_HANDLERS_KEY = Symbol('chartHandlers')

export function provideChartHandlers(): ChartGroup {
  const { group } = createV4ChartGroup()
  provide(CHART_HANDLERS_KEY, group)
  return group
}

export function useChartHandlers(): ChartGroup {
  const fallbackGroup = createV4ChartGroup().group
  return inject(CHART_HANDLERS_KEY, fallbackGroup)
}
