import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesData, TimeSeriesData } from '../timeseries/types/SeriesData'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import type {
  TimeSeriesEvent,
  TimeSeriesFlag,
} from '@deltares/fews-pi-requests'

const fewsPropertiesStore = useFewsPropertiesStore()

export interface TableSeriesData extends SeriesData {
  tooltip: boolean
  flagOrigin?: TimeSeriesFlag['source']
  flagQuality?: TimeSeriesFlag['quality']
  flagEdit?: TimeSeriesEvent['flagEdit']
  flagColor?: string
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
 * @param {ChartSeries[] | undefined} chartSeries - The array with the chart configuration per series.
 * @param {Record<string, Series>} seriesById - An object with time series with data resource IDs as keys.
 * @param {string[]} seriesIds - An array of unique series IDs.
 * @returns {TableData[]} - An array of records containing table data.
 */
export function createTableData(
  chartSeries: ChartSeries[],
  seriesById: Record<string, Series>,
  seriesIds: string[],
): TableData[] {
  // There may be duplicate IDs in the chartSeries array (e.g. for series with
  // lines and markers for the same data), but the seriesIds array should only
  // contain unique IDs. Hence, we do a map with a lookup over these IDs rather
  // than a filter.
  const usedChartSeries = seriesIds.map((id) =>
    chartSeries.find((series) => series.id === id),
  )

  // For each chart series, add its data to a map with the date's timestamp as
  // key. This allows us to easily merge the data from different series into a
  // single record.
  const data = new Map<number, TableData>()
  usedChartSeries.forEach((chartSeries) => {
    if (!chartSeries) return

    const dataResourceId = chartSeries.dataResources[0]
    const seriesData = seriesById[dataResourceId]?.data
    if (!seriesData) return

    // For each event in this series, add the event (and some additional data)
    // to the appropriate date in the map.
    seriesData.forEach((event) => {
      // We assume that the x value is a date.
      const date = event.x as Date

      const hasFlag = event.flag !== undefined
      const hasComment = event.comment !== undefined
      const showTooltip = hasFlag || hasComment

      const columnEvent: TableSeriesData = {
        ...event,
        tooltip: showTooltip,
      }
      // If the event has a flag, find the flag in the store and add the flag
      // origin, quality, edit and color.
      if (hasFlag) {
        const flag = fewsPropertiesStore.flags?.find(
          (f) => f.flag === event.flag,
        )
        if (flag) {
          columnEvent.flagOrigin = flag.source
          columnEvent.flagQuality = flag.quality
          columnEvent.flagEdit = getFlagEdit(
            event.flag,
            event.flagSource,
            flag.quality,
          )
          columnEvent.flagColor = getFlagColor(
            columnEvent.flagEdit,
            flag.quality,
          )
        }
      }

      // Check whether we already have an entry for this date, if we do, append
      // the new data to the existing entry, otherwise create a new entry.
      const timestamp = date.getTime()
      const current = data.get(timestamp)
      if (current) {
        current[chartSeries.id] = columnEvent
      } else {
        data.set(timestamp, {
          date,
          [chartSeries.id]: columnEvent,
        })
      }
    })
  })

  // Finally, create an array from the map and sort by date.
  return Array.from(data.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  )
}

/**
 * Returns the flag edit based on the flag, flag source and quality.
 * @param {TimeSeriesData['flag']} flag - The flag of the time series event.
 * @param {TimeSeriesData['flagSource']} source - The flag source of the time series event.
 * @param {TimeSeriesFlag['quality']} quality - The quality of the flag.
 * @returns {TimeSeriesEvent['flagEdit']} - The flag edit based on the flag, flag source and quality.
 */
function getFlagEdit(
  flag: TimeSeriesData['flag'],
  source: TimeSeriesData['flagSource'],
  quality?: TimeSeriesFlag['quality'],
): TimeSeriesEvent['flagEdit'] {
  if (flag === '6' && source === 'SFP') {
    return 'Persistent Unreliable'
  }

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
 * Returns the flag color based on the flag edit and flag quality.
 * @param {TimeSeriesEvent['flagEdit']} flagEdit - The flag edit of the time series event.
 * @param {TimeSeriesFlag['quality']} flagQuality - The quality of the flag.
 * @returns {string} - The flag color based on the flag edit and flag quality.
 */
function getFlagColor(
  flagEdit: TimeSeriesEvent['flagEdit'],
  flagQuality: TimeSeriesFlag['quality'],
): string {
  const edit = flagEdit?.toLowerCase().replace(' ', '-')
  const quality = flagQuality?.toLowerCase()

  const type = edit ?? quality ?? 'missing'
  return `var(--flag-${type}-color)`
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
