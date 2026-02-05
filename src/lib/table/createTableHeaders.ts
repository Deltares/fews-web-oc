import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import type { TableHeaders } from './types/TableHeaders'
import { SeriesData } from '../timeseries/types/SeriesData'

export function createTableHeaders(
  chartSeriesArray: ChartSeries[] | undefined,
  seriesIds: string[],
  allowDateSorting: boolean,
): TableHeaders[] {
  if (chartSeriesArray === undefined) return []
  const tableHeaders: TableHeaders[] = []
  tableHeaders.push({
    key: 'date',
    title: 'Date',
    editable: false,
    sortable: allowDateSorting,
  })
  seriesIds.forEach((seriesId) => {
    const chartSeries = chartSeriesArray.find((s) => s.id === seriesId)
    if (chartSeries !== undefined) {
      tableHeaders.push({
        key: chartSeries.id,
        title: formatHeader(chartSeries),
        color: chartSeries.style.stroke?.toString(),
        editable: chartSeries.editable ?? false,
        sort: sortSeriesData,
      })
    }
  })
  return tableHeaders
}
function formatHeader(chartSeries: ChartSeries): string {
  const label = chartSeries.name ?? ''
  const header = label
  return header
}

function sortSeriesData(a: SeriesData, b: SeriesData): number {
  return (a.y ?? 0) - (b.y ?? 0)
}
