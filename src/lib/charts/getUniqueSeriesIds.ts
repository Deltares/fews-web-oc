import uniq from 'lodash-es/uniq'
import type { ChartSeries } from './types/ChartSeries.js'

export function getUniqueSeriesIds(series: ChartSeries[] | undefined) {
  // Some ChartSeries appear twice in the ChartConfig; once for a line and once for a marker.
  // Only one of these has to be included in the table.
  if (series === undefined) return []
  return uniq(
    series.filter((series) => series.visibleInTable).map((series) => series.id),
  )
}
