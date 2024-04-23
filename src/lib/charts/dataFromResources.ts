import { Series } from "../timeseries/timeSeries"
import { SeriesArrayData } from "../timeseries/types/SeriesData"

/**
 * Retrieves a single array from the specified data resources. When multiple data resources are specified, the data is combined into a single array.
 * @param dataResources - An array of data resource IDs.
 * @param series - An object containing series data, where the keys are the resource IDs and the values are the series data.
 * @returns An array of SeriesData or SeriesArrayData objects.
 */
export function dataFromResources(dataResources: string[], series: Record<string, Series>) {
  if (dataResources.length > 1) {
    let data: SeriesArrayData[] = []
    let allFound = true
    for (const resourceId of dataResources) {
      if (series[resourceId] === undefined) {
        allFound = false
        break
      }
    }
    if (allFound) {
      const seriesData = series[dataResources[0]]
      for (const t of seriesData.data!) {
        data.push({ x: t.x, y: [t.y], flag: t.flag })
      }
      for (let i = 1; i < dataResources.length; i++) {
        const resourceId = dataResources[i]
        for (let t in data) {
          const dataItem = series[resourceId].data
          if (dataItem) {
            data[t].y.push(dataItem[t].y)
          }
        }
      }
    }
    return data
  } else {
    const seriesData = series[dataResources[0]]
    if (seriesData?.data !== undefined) return seriesData.data
    else return []
  }
}
