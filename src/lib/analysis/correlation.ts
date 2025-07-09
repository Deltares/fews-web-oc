import type {
  CorrelationFilter,
  TimeSeriesDisplaySubplot,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import { arrayOfAll } from '@/lib/utils/types'

export type RegressionEquation = {
  label: string
  value: CorrelationFilter['regressionEquation']
}

const arrayOfAllRegressionEquations = arrayOfAll<RegressionEquation>()
export const regressionEquations = arrayOfAllRegressionEquations([
  { label: 'Simple linear', value: 'simple linear' },
  { label: 'Multiple linear', value: 'multiple linear' },
  { label: 'Logarithmic', value: 'logarithmic' },
  { label: 'Hyperbolic', value: 'hyperbolic' },
  { label: 'Power', value: 'power' },
  { label: 'Exponential multiply', value: 'exponential multiply' },
])

export const CORRELATION_LINE_ID = 'correlation-line'
export const CORRELATION_POINTS_ID = 'correlation-points'

export function getCorrelationSubplot(yAxisName: string, xAxisName: string) {
  const baseItem = {
    visibleInPlot: true,
    visibleInTable: true,
    yAxis: {
      axisPosition: 'left',
      axisLabel: yAxisName,
    },
  }

  const line: TimeSeriesDisplaySubplotItem = {
    ...baseItem,
    type: 'line',
    legend: '{description} with r² = {rSquared}',
    color: '#080c80',
    markerStyle: 'none',
    lineStyle: 'solid;thick',
    lineWidth: 1,
    request: CORRELATION_LINE_ID,
    visibleInLegend: true,
  }

  const points: TimeSeriesDisplaySubplotItem = {
    ...baseItem,
    type: 'line',
    color: '#ff0000',
    markerStyle: 'circle',
    markerSize: 6,
    request: CORRELATION_POINTS_ID,
    visibleInLegend: false,
  }

  const subplot: TimeSeriesDisplaySubplot = {
    xAxis: {
      axisLabel: xAxisName,
    },
    items: [line, points],
  }

  return subplot
}
