import { DateTime, Settings } from 'luxon'
import { shallowRef } from 'vue'

/** Value of the `ui.timeZone` user setting for the browser's time zone. */
export const SYSTEM_TIME_ZONE = 'system'

// Reactive, so that dates formatted during render update on a change.
const displayTimeZone = shallowRef<string | undefined>(undefined)

/**
 * Whether `timeZone` is a value of the `ui.timeZone` user setting: `system` or
 * a time zone supported by the browser, e.g. `UTC` or `Europe/Amsterdam`.
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (timeZone === SYSTEM_TIME_ZONE) return true
  try {
    new Intl.DateTimeFormat(undefined, { timeZone })
    return true
  } catch {
    return false
  }
}

/**
 * The time zone dates are displayed in, as `timeZone` option for
 * `Intl.DateTimeFormat` and `toLocaleString`: `undefined` for the browser's
 * time zone.
 */
export function getDisplayTimeZone(): string | undefined {
  return displayTimeZone.value
}

/**
 * Returns `date` in the display time zone, for calendar fields such as the
 * hour or day, and day boundaries.
 */
export function toDisplayDateTime(date: Date | number): DateTime {
  const zone = getDisplayTimeZone() ?? SYSTEM_TIME_ZONE
  return typeof date === 'number'
    ? DateTime.fromMillis(date, { zone })
    : DateTime.fromJSDate(date, { zone })
}

/**
 * Sets the time zone dates are displayed in from the `ui.timeZone` user
 * setting. Also used by Luxon for dates without an explicit zone. Unknown
 * time zones fall back to the browser's time zone.
 */
export function setDisplayTimeZone(setting: string): void {
  const timeZone =
    setting === SYSTEM_TIME_ZONE || !isValidTimeZone(setting)
      ? undefined
      : setting
  Settings.defaultZone = timeZone ?? SYSTEM_TIME_ZONE
  displayTimeZone.value = timeZone
}

/**
 * Formats `date` like `Date.toLocaleString` with the browser locale, in the
 * display time zone.
 */
export function toDisplayLocaleString(
  date: Date | number,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Date(date).toLocaleString(undefined, {
    ...options,
    timeZone: getDisplayTimeZone(),
  })
}

/**
 * Formats `date` in the display time zone as value of an
 * `<input type="datetime-local">`: `yyyy-MM-ddTHH:mm`, or with seconds.
 */
export function toDisplayDateTimeInputValue(
  date: Date,
  withSeconds = false,
): string {
  return toDisplayDateTime(date).toFormat(
    withSeconds ? "yyyy-MM-dd'T'HH:mm:ss" : "yyyy-MM-dd'T'HH:mm",
  )
}

/**
 * Parses the value of an `<input type="datetime-local">` as date and time in
 * the display time zone, or in `timeZone` if given, e.g. the previous display
 * time zone, with `system` for the browser's time zone. Returns an invalid
 * date for an invalid value.
 */
export function fromDisplayDateTimeInputValue(
  value: string,
  timeZone = getDisplayTimeZone(),
): Date {
  const zone = timeZone ?? SYSTEM_TIME_ZONE
  return DateTime.fromISO(value, { zone }).toJSDate()
}

/**
 * Returns a date whose local date and time, e.g. `getHours()`, are the date
 * and time of `date` in the display time zone. For components that work in
 * local time, such as Vuetify date pickers.
 */
export function toWallClockDate(date: Date): Date {
  const dateTime = toDisplayDateTime(date)
  return new Date(
    dateTime.year,
    dateTime.month - 1,
    dateTime.day,
    dateTime.hour,
    dateTime.minute,
    dateTime.second,
    dateTime.millisecond,
  )
}

/** The inverse of `toWallClockDate`. */
export function fromWallClockDate(wallClockDate: Date): Date {
  const zone = getDisplayTimeZone() ?? SYSTEM_TIME_ZONE
  return DateTime.fromObject(
    {
      year: wallClockDate.getFullYear(),
      month: wallClockDate.getMonth() + 1,
      day: wallClockDate.getDate(),
      hour: wallClockDate.getHours(),
      minute: wallClockDate.getMinutes(),
      second: wallClockDate.getSeconds(),
      millisecond: wallClockDate.getMilliseconds(),
    },
    { zone },
  ).toJSDate()
}
