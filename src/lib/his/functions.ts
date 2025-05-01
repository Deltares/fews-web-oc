import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesResourceType } from '@/lib/timeseries/types'
import { calculateCorrelationTimeSeries } from './correlation'

export const hisFunctionToGenerator = {
  correlation: generateSeriesCorrelation,
} as const

export function generateSeriesCorrelation(
  series: Record<string, Series>,
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

  return {
    [lineId]: newSeriesLine,
    [pointsId]: newSeriesPoints,
  }
}
