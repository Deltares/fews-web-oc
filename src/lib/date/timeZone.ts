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
