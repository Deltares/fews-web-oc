import type {ChartSeries} from "@/components/TimeSeriesComponent/lib/ChartSeries";
import {Series} from "@/lib/TimeSeries";
import {uniqWith} from "lodash";
import i18n from '@/i18n'

export function createTableData(chartSeriesArray: ChartSeries[] | undefined, seriesRecord: Record<string, Series>, seriesIds: string[]): Record<string, unknown>[] {
  if (chartSeriesArray === undefined) return []
  const dateTimes = createDateTimes(chartSeriesArray, seriesRecord)

  const chartSeries = uniqWith(chartSeriesArray.filter((s) => seriesIds.includes(s.id)), (a,b) => {return a.id === b.id})
  const p = Array(seriesIds.length).fill(0)

  return dateTimes.map((date: Date) => {
    const result: any = {}
    result.date = i18n.d(date, 'datatable')
    for ( const j in chartSeries ) {
      const s = chartSeries[j]
      const series = seriesRecord[s.dataResources[0]]
      let eventResult = {}
      if (series && series.data) {
        const event = series.data[p[j]]
        if (event && date.getTime() === event.x.getTime()) {
          eventResult = {
            value: event.y,
            flag: event.flag,
            flagSource: event.flagSource,
            comment: event.comment,
            user: event.user
          }
          p[j]++
        }
        result[s.id] = eventResult
      }
    }
    return result
  })
}

export function createEditTableData(tableData: Record<string, any>[], seriesId: string): Record<string, unknown>[] {
  const editTableData = tableData.map((datum) => {
    let result = { date: datum.date}
    result = {...result, ...datum[seriesId]}
    return result
  })
  return editTableData
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
