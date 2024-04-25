import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { Series } from '@/lib/timeseries/timeSeries'
import { uniqWith } from 'lodash-es'
import { SeriesData, TimeSeriesData } from '../timeseries/types/SeriesData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import type {
  TimeSeriesEvent,
  TimeSeriesFlag,
} from '@deltares/fews-pi-requests'

const store = useFewsPropertiesStore()
export interface TableSeriesData extends SeriesData {
  tooltip: boolean
  flagOrigin?: TimeSeriesFlag['source']
  flagQuality?: TimeSeriesFlag['quality']
  flagEdit?: TimeSeriesEvent['flagEdit']
}

export interface TableData {
  date: Date
  [key: string]: Partial<TableSeriesData> | Date
}

export const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
})

/**
 *
 * Creates table data based of the given series IDs, based on the chart series and the time series.
 * @param {ChartSeries[] | undefined} chartSeriesArray - The array with the chart configuration per series.
 * @param {Record<string, Series>} seriesRecord - The record of the time series.
 * @param {string[]} seriesIds - An array of series IDs.
 * @returns {TableData[]} - An array of records containing table data.
 */
export function createTableData(
  chartSeriesArray: ChartSeries[] | undefined,
  seriesRecord: Record<string, Series>,
  seriesIds: string[],
): TableData[] {
  if (chartSeriesArray === undefined) return []
  const dateTimes = createDateTimes(
    chartSeriesArray.map((s) => s.dataResources[0]),
    seriesRecord,
  )

  const chartSeries = uniqWith(
    chartSeriesArray.filter((s) => seriesIds.includes(s.id)),
    (a, b) => {
      return a.id === b.id
    },
  )
  const pointers = Array(seriesIds.length).fill(0)

  const data = dateTimes.map((date: Date) => {
    const result: TableData = { date }
    for (const j in chartSeries) {
      const s = chartSeries[j]
      const series = seriesRecord[s.dataResources[0]]
      let eventResult: Partial<TableSeriesData> = {}
      if (series && series.data) {
        const event = series.data[pointers[j]] as TimeSeriesData
        if (event && date.getTime() === event.x.getTime()) {
          eventResult = {
            tooltip: event.flag !== undefined || event.comment !== undefined,
            ...event,
          }
          if (event.flag !== undefined && store.flags !== undefined) {
            const flag = store.flags.find((f) => f.flag === event.flag)
            if (flag !== undefined) {
              eventResult.flagOrigin = flag.source
              eventResult.flagQuality = flag.quality
              eventResult.flagEdit = qualityToFlagEdit(
                event.flag,
                event.flagSource,
                flag?.quality,
              )
            }
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
 * Converts a quality string to a flag edit string.
 * @param {TimeSeriesFlag['quality']} quality - The quality string to be converted.
 * @returns {TimeSeriesEvent['flagEdit']} - The flag edit string.
 */
function qualityToFlagEdit(
  flag: TimeSeriesData['flag'],
  source: TimeSeriesData['flagSource'],
  quality?: TimeSeriesFlag['quality'],
): TimeSeriesEvent['flagEdit'] {
  if (flag === '6' && source === 'SFP') {
    return 'Persistent Unreliable'
  }

  // @ts-expect-error: remove once pi-requests is updated
  if (flag === '14') {
    return 'Accumulation Reset'
  }

  switch (quality) {
    case 'RELIABLE':
      return 'Reliable'
    case 'DOUBTFUL':
      return 'Doubtful'
    case 'UNRELIABLE':
      return 'Unreliable'
  }
}

/**
 * Parses an js date to a date string, time string, in UTC, as used by the FEWS PI service.
 * @param {Date} dateTime - The js date to be parsed.
 * @returns {{ date: string; time: string; timeZone: string }} - An object containing the date string, time string, and time zone string.
 */
function dateToPiDateTime(dateTime: Date): {
  date: string
  time: string
} {
  const dateString = dateTime.toISOString()
  const [date, timeString] = dateString.split('T')
  const time = timeString.split('.')[0]
  return { date, time }
}

/**
 *
 * Creates time series data from table data.
 * @param {TableData[]} tableData - An array of records containing table data.
 * @returns {Record<string, TimeSeriesEvent[]>} - An array of records containing time series data. The keys are the series IDs.
 */
export function tableDataToTimeSeries(
  tableData: TableData[],
  seriesIds: string[],
): Record<string, TimeSeriesEvent[]> {
  const newTimeSeriesData: Record<string, TimeSeriesEvent[]> = {}
  tableData.forEach((tableItem) => {
    const date = tableItem.date
    const { date: piDate, time: piTime } = dateToPiDateTime(date)
    Object.keys(tableItem).forEach((key) => {
      if (seriesIds.includes(key)) {
        const tableDatum = tableItem[key] as TableSeriesData
        const timeSeriesEvent: TimeSeriesEvent = {
          date: piDate,
          time: piTime,
          value: tableDatum.y?.toString() ?? '',
          flag: tableDatum.flag,
          flagEdit: tableDatum.flagEdit,
          comment: tableDatum.comment,
        }
        if (newTimeSeriesData[key] === undefined) {
          newTimeSeriesData[key] = [timeSeriesEvent]
        } else {
          newTimeSeriesData[key].push(timeSeriesEvent)
        }
      }
    })
  })
  return newTimeSeriesData
}

/**
 *
 * Creates an array of unique dates from the data in the chart series.
 * @param {ChartSeries[]} chartSeriesArray - The array with the chart configuration per series.
 * @param {Record<string, Series>} seriesRecord - The record of the time series.
 * @returns {Date[]} An array of unique dates from the data in the chart series.
 */
export function createDateTimes(
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
export function sortedUniqueDates(dates: Date[]): Date[] {
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
