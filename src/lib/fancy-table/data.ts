import { Series } from '@/lib/timeseries/timeSeries'

export interface FancyTableEvent {
  date: Date
  value: number | null
}

export interface FancyTableData {
  unit?: string
  events: FancyTableEvent[]
}

export function getFancyTableEventKey(event: unknown): number {
  return (event as FancyTableEvent).date.getTime()
}

export function gatherUniqueDates(allSeries: Series[]): Date[] {
  // Gather a sorted array of unique timestamps that have an associated value.
  const uniqueTimestamps = new Set(
    allSeries.flatMap((series) => {
      if (!series.data) return []
      // Only add dates for which a value is defined.
      return series.data
        .filter((event) => event.y !== null)
        .map((event) => (event.x as Date).getTime())
    }),
  )
  return Array.from(uniqueTimestamps)
    .sort((a, b) => a - b)
    .map((timestamp) => new Date(timestamp))
}

export function transformTimeSeries(
  series: Series | undefined,
  dates: Date[],
): FancyTableData {
  if (!series || !series.data) {
    // Return series with all events set to null.
    const events: FancyTableEvent[] = dates.map((date) => {
      return { date, value: null }
    })
    return { events }
  }
  // Create a map with a null value for all unique dates.
  const eventsMap = new Map<number, number | null>(
    dates.map((date) => [date.getTime(), null]),
  )
  // Then fill in the map with the events for which we have a value.
  series.data.forEach((event) => {
    if (event.x === null || event.y === null) return
    // Assume all x-values are dates
    const date = event.x as Date
    // Do not add the event if it does not exist in the specified dates array.
    if (!eventsMap.has(date.getTime())) return

    // Overwrite the null value with the actual value.
    eventsMap.set(date.getTime(), event.y)
  })

  // Finally, create an array of events from the map, sorted by the date.
  const events: FancyTableEvent[] = Array.from(eventsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map((kv) => {
      return { date: new Date(kv[0]), value: kv[1] }
    })
  return {
    events,
    unit: series.header.unit,
  }
}
