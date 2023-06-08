import {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {TableHeaders} from "@/components/TimeSeriesComponent/lib/TableHeaders";
import {uniqWith} from "lodash";

export function createTableHeaders(chartSeriesArray: ChartSeries[] | undefined, seriesIds: string[]): TableHeaders[] {
  if (chartSeriesArray === undefined) return []
  const tableHeaders: TableHeaders[] = []
  tableHeaders.push({value: 'date', text: 'Date', width: '200px', class: 'sticky-column', cellClass: 'sticky-column', editable: false})

  const chartSeriesUnique = uniqWith(chartSeriesArray.filter((s) => seriesIds.includes(s.id)), (a,b) => {return a.id === b.id})
  for (const chartSeries of chartSeriesUnique) {
    if (chartSeries !== undefined) {
      tableHeaders.push({
        value: chartSeries.id,
        text: formatHeader(chartSeries),
        color: chartSeries.style.stroke?.toString(),
        editable: true
      })
    }
  }
  return tableHeaders
}

export function createEditTableHeaders(chartSeriesArray: ChartSeries[] | undefined, seriesId: string): TableHeaders[] {
  if (chartSeriesArray === undefined) return []
  const chartSeries = chartSeriesArray.find((s) => s.id === seriesId)
  if (chartSeries === undefined) return []
  const tableHeaders: TableHeaders[] = [
    {value: 'date', text: 'Date', width: '200px', class: 'sticky-column', cellClass: 'sticky-column', editable: false},
    {value: 'value', text: formatHeader(chartSeries), color: chartSeries.style.stroke?.toString(), editable: false},
    {value: 'flag', text: 'Flag', editable: false},
    {value: 'flagSource', text: 'Flag source', editable: false},
    {value: 'user', text: 'User', editable: false},
    {value: 'comment', text: 'Comment', editable: false},
  ]
  return tableHeaders
}

function formatHeader(chartSeries: ChartSeries): string {
  const label = chartSeries.name ?? ''
  const header = label
  return header
}

