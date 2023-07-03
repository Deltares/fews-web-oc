import {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {Series} from "@/lib/TimeSeries";

export function createTableData(chartSeriesArray: ChartSeries[] | undefined, seriesRecord: Record<string, Series>, seriesIds: string[]): Record<string, unknown>[] {
  if (chartSeriesArray === undefined) return []
  const dateTimes = createDateTimes(chartSeriesArray, seriesRecord)

  const series = chartSeriesArray.filter((s) => seriesIds.includes(s.id))
  const p = Array(seriesIds.length).fill(0)
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  })

  return dateTimes.map((date: Date, i: number) => {
    const result: any = {}
    result.date = dateFormatter.format(date)
    for ( const j in series ) {
      const s = series[j]
      const data = seriesRecord[s.dataResources[0]]
      const event = data.data[p[j]]
      let value = null
      if (date.getTime() === event.x.getTime()) {
        value = event.y
        p[j]++
      }
      result[s.id] = value
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
