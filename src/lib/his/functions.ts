import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesResourceType } from '@/lib/timeseries/types'
import { calculateCorrelationTimeSeries } from './correlation'
import { TimeSeriesDisplaySubplot } from '@deltares/fews-pi-requests'
import { HisFunction } from './types'

type Generator = (
  series: Record<string, Series>,
  subplot: TimeSeriesDisplaySubplot,
  seriesIds: string[],
) => Record<string, Series>

export const hisFunctionToGenerator: Record<HisFunction, Generator> = {
  correlation: generateSeriesCorrelation,
} as const

export function getGenerator(functionName: HisFunction): Generator {
  const generator = hisFunctionToGenerator[functionName]
  if (!generator) {
    throw new Error(`No generator found for function ${functionName}`)
  }
  return generator
}

export function generateSeriesCorrelation(
  series: Record<string, Series>,
  subplot: TimeSeriesDisplaySubplot,
  seriesIds: string[],
) {
  const id1 = seriesIds[0]
  const id2 = seriesIds[1]

  const series1 = series[id1]
  const series2 = series[id2]

  // TODO: Add some behaviour for missing dependants
  if (!series1?.data || !series2?.data) return {}

  const correlation = calculateCorrelationTimeSeries(series1.data, series2.data)

  const newSeriesLine = new Series({
    type: SeriesResourceType.Derived,
  })
  newSeriesLine.lastUpdated = new Date()
  newSeriesLine.data = correlation.line

  const newSeriesPoints = new Series({
    type: SeriesResourceType.Derived,
  })
  newSeriesPoints.lastUpdated = new Date()
  newSeriesPoints.data = correlation.points

  const lineId = `${id1}-${id2}-correlation-line`
  const pointsId = `${id1}-${id2}-correlation-points`

  const newSeries = {
    [lineId]: newSeriesLine,
    [pointsId]: newSeriesPoints,
  }

  subplot.items.forEach((item) => {
    if (item.request === lineId) {
      item.legend = getSlopeInterceptLegend(
        correlation.slope,
        correlation.intercept,
      )
    }
  })

  return newSeries
}

function getSlopeInterceptLegend(
  slope: number | undefined,
  intercept: number | undefined,
  precision: number = 3,
): string {
  if (slope === undefined || intercept === undefined) {
    return 'Correlation line'
  }

  const slopeText = `${slope.toExponential(precision)}x`
  const interceptSign = intercept < 0 ? '- ' : '+ '
  const interceptText = `${Math.abs(intercept).toExponential(precision)}`
  return `f(x) = ${slopeText} ${interceptSign}${interceptText}`
}
