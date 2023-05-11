import {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {TableHeaders} from "@/components/TimeSeriesComponent/lib/TableHeaders";

export function createTableHeaders(chartSeriesArray: ChartSeries[] | undefined, seriesIds: string[]): TableHeaders[] {
  if (chartSeriesArray === undefined) return []
  const tableHeaders: TableHeaders[] = []
  tableHeaders.push({value: 'date', text: 'Date', width: '200px', class: 'sticky-column', cellClass: 'sticky-column'})
  seriesIds.forEach((seriesId) => {
    const chartSeries = chartSeriesArray.find((s) => s.id === seriesId)
    if (chartSeries !== undefined) {
      tableHeaders.push({
        value: chartSeries.id,
        text: formatHeader(chartSeries),
        color: chartSeries.style.stroke?.toString()
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

