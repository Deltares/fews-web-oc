import { DateTime, Duration, DurationLikeObject } from 'luxon'

/**
 * Converts a date to a string in the format 'YYYY-MM-DDTHH:MM'.
 * @param date - The date to convert.
 * @returns The date as a string in the format 'YYYY-MM-DDTHH:MM'.
 */
export function toISOString(date: Date) {
  const years = date.getFullYear()
  const months = String(date.getMonth() + 1).padStart(2, '0')
  const days = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${years}-${months}-${days}T${hours}:${minutes}:${seconds}`
}

/**
 * Gets the midpoint of two dates.
 * @param d1 - The first date.
 * @param d2 - The second date.
 * @returns The midpoint of the two dates.
 */
export function getMidpointOfDates(d1: Date, d2: Date) {
  return d1.getTime() > d2.getTime()
    ? new Date(d1.getTime() - (d1.getTime() - d2.getTime()) / 2)
    : new Date(d1.getTime() + (d2.getTime() - d1.getTime()) / 2)
}

/**
 * Gets the date with the given minutes offset.
 * @param date - The date.
 * @param minutesOffset - The minutes offset.
 * @returns The date with the given minutes offset.
 */
export function getDateWithMinutesOffset(date: Date, minutesOffset: number) {
  const result = new Date(date)
  result.setMinutes(result.getMinutes() + minutesOffset)
  return result
}

/**
 * Converts a FEWS PI date/time object to a Date object.
 *
 * @param fewsDatetime - The FEWS date/time object to convert.
 * @param timeZoneOffsetString - Timezone offset string to apply to the date.
 *   E.g., '+02:00' or 'Z'.
 * @returns The date/time as a Date object.
 */
export function convertFewsPiDateTimeToJsDate(
  fewsDatetime: { date: string; time: string },
  timeZoneOffsetString: string = 'Z',
): Date {
  return new Date(
    `${fewsDatetime.date}T${fewsDatetime.time}${timeZoneOffsetString}`,
  )
}

/**
 * Converts a JavaScript Date object to a FEWS PI date/time object.
 *
 * @param date - The JavaScript Date object to convert.
 * @returns An object with 'date' and 'time' properties in the format
 *  expected by FEWS PI.
 */
export function convertJsDateToFewsPiDateTime(date: Date): {
  date: string
  time: string
} {
  const isoString = date.toISOString()
  const datePart = isoString.slice(0, 10) // 'YYYY-MM-DD'
  const timePart = isoString.slice(11, 19) // 'HH:mm:ss'
  return {
    date: datePart,
    time: timePart,
  }
}

/**
 * Converts a date to a string suitable for use as a FEWS PI query parameter.
 *
 * FEWS PI accepts dates in the format 'YYYY-MM-DDTHH:MM:SSZ', almost an ISO8601
 * string, but it does not accept milliseconds.
 *
 * @param date date to convert.
 * @returns string suitable for use as a FEWS PI query parameter.
 */
export function convertJSDateToFewsPiParameter(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}
export function convertTimestampToFewsPiParameter(timestamp: number): string {
  return convertJSDateToFewsPiParameter(new Date(timestamp))
}

/**
 * Convert date to date time string for datetime-local input.
 *
 * @param date - The date to convert.
 * @returns The date as a string in the format 'YYYY-MM-DDTHH:MM'.
 */
export function convertDateToDateTimeString(date: Date): string {
  return date.toISOString().slice(0, 16)
}

export function toHumanReadableDate(
  date: Date | string | number | undefined | null,
): string {
  if (date === undefined || date === null) {
    return '—'
  }
  if (typeof date === 'string' || typeof date === 'number') {
    return toHumanReadableDate(new Date(date))
  }
  // dd/MM/yyyy, HH:mm:ss
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function toHumanReadableTime(
  date: Date | string | number | undefined | null,
): string {
  if (date === undefined || date === null) {
    return '—'
  }
  if (typeof date === 'string' || typeof date === 'number') {
    return toHumanReadableTime(new Date(date))
  }
  // HH:mm:ss
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function toShortHumanReadableDate(
  date: Date | string | number | undefined | null,
): string {
  if (date === undefined || date === null) {
    return '—'
  }
  if (typeof date === 'string' || typeof date === 'number') {
    return toShortHumanReadableDate(new Date(date))
  }
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function toDateRangeString(
  startDate: Date | string | number | undefined | null,
  endDate: Date | string | number | undefined | null,
): string {
  return `${toHumanReadableDate(startDate)} → ${toHumanReadableDate(endDate)}`
}

/**
 * Calculates the absolute difference between two dates and returns it
 * as a human-readable string using the two largest time units.
 *
 * For example, a difference of 18 days and 3 hours will be represented as "2w 4d".
 *
 * @param startDate - The starting date (can be a Date object, timestamp, or date string)
 * @param endDate - The ending date (can be a Date object, timestamp, or date string)
 * @param options - Optional settings:
 *   - excludeSeconds: If true, seconds will not be included in the output
 *   - relativeFormat: If true, formats the result as a relative time string (e.g. "in 2w 4d" or "2w 4d ago")
 * @returns A human-readable string representing the absolute time difference,
 *          or "—" if either date is invalid or missing
 */
export function toDateAbsDifferenceString(
  startDate: Date | string | number | undefined | null,
  endDate: Date | string | number | undefined | null,
  options?: { excludeSeconds?: boolean; relativeFormat?: boolean },
): string {
  if (
    startDate === undefined ||
    startDate === null ||
    endDate === undefined ||
    endDate === null
  ) {
    return '—'
  }
  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)

  const duration = Math.abs(endDateObj.getTime() - startDateObj.getTime())
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  const differenceString = [
    weeks ? `${weeks}w` : '',
    days % 7 ? `${days % 7}d` : '',
    hours % 24 ? `${hours % 24}h` : '',
    minutes % 60 ? `${minutes % 60}m` : '',
    !options?.excludeSeconds && seconds % 60 ? `${seconds % 60}s` : '',
  ]
    .filter((part) => part)
    .slice(0, 2)
    .join(' ')

  const result = differenceString ? differenceString : '0s'

  if (options?.relativeFormat) {
    return endDateObj.getTime() - startDateObj.getTime() < 0
      ? `${result} ago`
      : `in ${result}`
  }
  return result
}

export function toDateSpanString(
  startDate: Date | string | number | undefined | null,
  endDate: Date | string | number | undefined | null,
) {
  return `${toDateRangeString(startDate, endDate)} (${toDateAbsDifferenceString(startDate, endDate)})`
}

export function toDateArray(period: string): Date[] {
  // Split the period string into start, end, and interval parts
  const [start, end, interval] = period.split('/')

  // Parse dates using JavaScript Date
  const startDate = new Date(start)
  const endDate = new Date(end)

  // Parse interval duration using Luxon
  const intervalDuration = Duration.fromISO(interval)

  // Convert Luxon duration to milliseconds
  const intervalMs = intervalDuration.as('milliseconds')

  // Generate array of datetimes
  const result = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    result.push(currentDate)

    // Add interval using milliseconds
    currentDate = new Date(currentDate.getTime() + intervalMs)
  }

  return result
}

export function addDuration(date: Date, duration: DurationLikeObject) {
  return DateTime.fromJSDate(date)
    .plus(Duration.fromObject(duration))
    .toJSDate()
}
