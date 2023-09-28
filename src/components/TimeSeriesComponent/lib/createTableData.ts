import type {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {Series} from "@/lib/TimeSeries";
import {uniqWith} from "lodash";

const tableDateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false
})

export const tableDateFormatter = (date: Date): string => {
  return tableDateFormat.format(date)
}

export const csvDateFormatter = (date: Date): string => {
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function createTableData(
  chartSeriesArray: ChartSeries[] | undefined, 
  seriesRecord: Record<string, Series>, 
  seriesIds: string[], 
  dateFormatter: (name: Date) => string = tableDateFormatter): Record<string, unknown>[] {

  if (chartSeriesArray === undefined) return []
  const dateTimes = createDateTimes(chartSeriesArray, seriesRecord)

  const chartSeries = uniqWith(chartSeriesArray.filter((s) => seriesIds.includes(s.id)), (a,b) => {return a.id === b.id})
  const p = Array(seriesIds.length).fill(0)

  return dateTimes.map((date: Date) => {
    const result: any = {}
    result.date = dateFormatter(date)
    for ( const j in chartSeries ) {
      const s = chartSeries[j]
      const series = seriesRecord[s.dataResources[0]]
      let value = undefined
      if (series && series.data) {
        const event = series.data[p[j]]
        if (event && date.getTime() === event.x.getTime()) {
          value = event.y
          p[j]++
        }
        result[s.id] = value
      }
    }
    return result
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
      dates.push(...series.data.map((d: any) => d.x) )
    }
  }
  return sortUniqueDates(dates)
}

/**
*
* Sorts an array of dates in ascending order and removes any duplicate dates.
* @param {Date[]} dates - The array of dates to be sorted and made unique.
* @returns {Date[]} A new array of dates sorted in ascending order without any duplicates.
*/
function sortUniqueDates(dates: Date[]): Date[] {
  if (dates.length === 0) return dates;
  dates.sort((a, b) => {
    return a.getTime() - b.getTime()
  })
  const results = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    if (dates[i-1].getTime() !== dates[i].getTime()) {
      results.push(dates[i]);
    }
  }
  return results;
}
