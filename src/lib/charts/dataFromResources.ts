import type { Series } from '../timeseries/timeSeries'
import {
  isSeriesArrayData,
  type SeriesArrayData,
  type SeriesData,
  type TimeSeriesData,
} from '@/lib/timeseries/types/SeriesData'

/**
 * Determines if the specified data is reliable.
 * @param data - A SeriesData or SeriesArrayData object.
 * @returns True if the data is reliable, false otherwise.
 */
export function isReliableData(data: SeriesArrayData | SeriesData) {
  // Hardcoded unreliable flags since backend does not provide this information
  const unreliableFlags = ['6', '7', '8']
  return !unreliableFlags.includes(data.flag)
}

/**
 *
 * Creates an array of unique dates from the data in the chart series.
 * @param {ChartSeries[]} chartSeriesArray - The array with the chart configuration per series.
 * @param {Record<string, Series>} seriesRecord - The record of the time series.
 * @returns {Date[]} An array of unique dates from the data in the chart series.
 */
function createDateTimes(
  dataResources: string[],
  seriesRecord: Record<string, Series>,
): Date[] {
  if (dataResources === undefined) {
    return []
  }
  const dates: Date[] = []
  for (const dataResource of dataResources) {
    const series = seriesRecord[dataResource]
    if (series !== undefined && series.data !== undefined) {
      dates.push(...series.data.map((d: any) => d.x))
    }
  }
  return sortedUniqueDates(dates)
}

/**
 *
 * Sorts an array of dates in ascending order and removes any duplicate dates.
 * @param {Date[]} dates - The array of dates to be sorted and made unique.
 * @returns {Date[]} A new array of dates sorted in ascending order without any duplicates.
 */
function sortedUniqueDates(dates: Date[]): Date[] {
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

/**
 * Retrieves a single array from the specified data resources. When multiple data resources are specified, the data is combined into a single array.
 * @param dataResources - An array of data resource IDs.
 * @param series - An object containing series data, where the keys are the resource IDs and the values are the series data.
 * @returns An array of SeriesData or SeriesArrayData objects.
 */
export function dataFromResources(
  dataResourceIds: string[],
  series: Record<string, Series>,
) {
  let data: (SeriesData | SeriesArrayData)[] = []
  if (dataResourceIds.length > 1) {
    let allFound = true
    for (const resourceId of dataResourceIds) {
      if (series[resourceId] === undefined) {
        allFound = false
        break
      }
    }
    if (allFound) {
      const dateTimes = createDateTimes(dataResourceIds, series)
      const pointers = Array(dataResourceIds.length).fill(0)
      data = dateTimes.map((date: Date) => {
        const result: any = { x: date }
        const values = Array(dataResourceIds.length).fill(null)
        const flags = Array(dataResourceIds.length).fill(undefined)
        for (const j in dataResourceIds) {
          const resourceId = dataResourceIds[j]
          const s = series[resourceId]
          if (s && s.data) {
            const event = s.data[pointers[j]] as TimeSeriesData
            if (event && date.getTime() === event.x.getTime()) {
              values[j] = event.y
              flags[j] = event.flag
              pointers[j]++
            }
          }
        }
        result.y = values
        result.flag = flags
        return result
      })
    }
  } else {
    data = series[dataResourceIds[0]]?.data ?? []
  }
  return data
}

/**
 * Replaces unreliable data with null values from a list of SeriesData or SeriesArrayData objects.
 * @param data - An array of SeriesData or SeriesArrayData objects.
 * @returns An array of SeriesData or SeriesArrayData objects with unreliable data removed.
 */
export function removeUnreliableData(data: (SeriesArrayData | SeriesData)[]) {
  return data.map((event) => {
    if (isReliableData(event)) return { ...event }
    return {
      ...event,
      y: isSeriesArrayData(event) ? new Array(event.y.length).fill(null) : null,
    }
  }) as (SeriesArrayData | SeriesData)[]
}
