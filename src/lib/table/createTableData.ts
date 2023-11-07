import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { Series } from '@/lib/timeseries/timeSeries'
import { uniqWith } from 'lodash'
import { SeriesData } from '../timeseries/types/SeriesData'

interface TableSeriesData extends Omit<SeriesData, 'x' | 'y'> {
  value: number | null
  tooltip: boolean
}
/**
 *
 * Creates table data based of the given series IDs, based on the chart series and the time series.
 * @param {ChartSeries[] | undefined} chartSeriesArray - The array with the chart configuration per series.
 * @param {Record<string, Series>} seriesRecord - The record of the time series.
 * @param {string[]} seriesIds - An array of series IDs.
 * @returns {Record<string, unknown>[]} - An array of records containing table data.
 */
export function createTableData(
  chartSeriesArray: ChartSeries[] | undefined,
  seriesRecord: Record<string, Series>,
  seriesIds: string[],
): Record<string, unknown>[] {
  if (chartSeriesArray === undefined) return []
  const dateTimes = createDateTimes(chartSeriesArray, seriesRecord)

  const chartSeries = uniqWith(
    chartSeriesArray.filter((s) => seriesIds.includes(s.id)),
    (a, b) => {
      return a.id === b.id
    },
  )
  const pointers = Array(seriesIds.length).fill(0)
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  })

  const data = dateTimes.map((date: Date) => {
    const result: any = {}
    result.date = dateFormatter.format(date)
    for (const j in chartSeries) {
      const s = chartSeries[j]
      const series = seriesRecord[s.dataResources[0]]
      let eventResult: Partial<TableSeriesData> = {}
      if (series && series.data) {
        const event = series.data[pointers[j]]
        if (event && date.getTime() === event.x.getTime()) {
          eventResult = {
            value: event.y,
            flag: event.flag,
            flagSource: event.flagSource,
            tooltip: event.flag !== undefined || event.comment !== undefined,
            comment: event.comment,
            user: event.user,
          }
          pointers[j]++
        }
        result[s.id] = eventResult
      }
    }
    return result
  })
  return data
}

/**
 *
 * Creates an array of unique dates from the data in the chart series.
 * @param {ChartSeries[]} chartSeriesArray - The array with the chart configuration per series.
 * @param {Record<string, Series>} seriesRecord - The record of the time series.
 * @returns {Date[]} An array of unique dates from the data in the chart series.
 */
function createDateTimes(
  chartSeriesArray: ChartSeries[] | undefined,
  seriesRecord: Record<string, Series>,
): Date[] {
  if (chartSeriesArray === undefined) {
    return []
  }
  const dates: Date[] = []
  for (const chartSeries of chartSeriesArray) {
    const series = seriesRecord[chartSeries.dataResources[0]]
    if (series !== undefined && series.data !== undefined) {
      dates.push(...series.data.map((d: any) => d.x))
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
  if (dates.length === 0) return dates
  dates.sort((a, b) => {
    return a.getTime() - b.getTime()
  })
  const results = [dates[0]]
  for (let i = 1; i < dates.length; i++) {
    if (dates[i - 1].getTime() !== dates[i].getTime()) {
      results.push(dates[i])
    }
  }
  return results
}
