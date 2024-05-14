import { createDateTimes } from '../table/tableData'
import { Series } from '../timeseries/timeSeries'
import { SeriesArrayData, TimeSeriesData } from '../timeseries/types/SeriesData'

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
  if (dataResourceIds.length > 1) {
    let data: SeriesArrayData[] = []
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
    return data
  } else {
    const seriesData = series[dataResourceIds[0]]
    if (seriesData?.data !== undefined) return seriesData.data
    else return []
  }
}
