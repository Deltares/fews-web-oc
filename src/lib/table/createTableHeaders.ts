import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import type { TableHeaders } from './types/TableHeaders'

export function createTableHeaders(
  chartSeriesArray: ChartSeries[] | undefined,
  seriesIds: string[],
): TableHeaders[] {
  if (chartSeriesArray === undefined) return []
  const tableHeaders: TableHeaders[] = []
  tableHeaders.push({
    key: 'date',
    title: 'Date',
    minWidth: '24ch',
    class: 'table-header sticky-column',
  })
  seriesIds.forEach((seriesId) => {
    const chartSeries = chartSeriesArray.find((s) => s.id === seriesId)
    if (chartSeries !== undefined) {
      tableHeaders.push({
        key: chartSeries.id,
        title: formatHeader(chartSeries),
        color: chartSeries.style.stroke?.toString(),
        class: 'table-header',
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
