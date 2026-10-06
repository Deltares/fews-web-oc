import type { Series } from '@/lib/timeseries/timeSeries'
import type { SeriesData } from '@/lib/timeseries/types/SeriesData'

export function createSeriesDateIndex(
  seriesById: Record<string, Pick<Series, 'data'>>,
): Map<string, Set<SeriesData['x']>> {
  return new Map(
    Object.entries(seriesById).map(([id, series]) => [
      id,
      new Set(series.data?.map((point) => point.x)),
    ]),
  )
}
