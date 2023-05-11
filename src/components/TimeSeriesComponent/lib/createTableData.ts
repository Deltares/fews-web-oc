import {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {Series} from "@/lib/TimeSeries";

export function createTableData(chartSeriesArray: ChartSeries[] | undefined, seriesRecord: Record<string, Series>, seriesIds: string[]): Record<string, unknown>[] {
  if (chartSeriesArray === undefined) return []
  const dateTimes = createDateTimes(chartSeriesArray, seriesRecord)

  const seriesDef = chartSeriesArray
  return dateTimes.map((date: Date) => {
    const event: any = {}
    event.date = date.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    })
    for (const seriesId of seriesIds) {
      const chartSeries = seriesDef.find((s) => s.id === seriesId)
      if (chartSeries === undefined) continue
      const series = seriesRecord[chartSeries.dataResources[0]]
      if (series === undefined) {
        event[chartSeries.id] = null
      } else {
        const data = series.data ?? []
        const selected = data.find((dataPoint: { x: Date, y: number }) => date.getTime() === dataPoint.x.getTime())
        event[chartSeries.id] = selected !== undefined ? selected.y : null
      }
    }
    return event
  })
}

function createDateTimes(chartSeriesArray: ChartSeries[] | undefined, seriesRecord: Record<string, Series>): Date[] {
  if (chartSeriesArray === undefined) {
    return []
  }
  const dates: Date[] = []
  for (const chartSeries of chartSeriesArray) {
    const series = seriesRecord[chartSeries.dataResources[0]]
    if (series !== undefined && series.data !== undefined) {
      for (const event of series.data) {
        if (dates.findIndex(date => {
          return date.getTime() === event.x.getTime()
        }) === -1) {
          dates.push(event.x)
        }
      }
    }
  }
  dates.sort((a, b) => {
    return a.getTime() - b.getTime()
  })
  return dates
}

