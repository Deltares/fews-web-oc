import type { Series } from '@/lib/timeseries/timeSeries'

export function createSeriesDateIndex(
  seriesById: Record<string, Pick<Series, 'data'>>,
): Map<string, Set<number>> {
  return new Map(
    Object.entries(seriesById).map(([id, series]) => [
      id,
      new Set(series.data?.map((point) => (point.x as Date).getTime())),
    ]),
  )
}
