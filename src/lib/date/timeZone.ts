/** Value of the `ui.timeZone` user setting for the browser's time zone. */
export const SYSTEM_TIME_ZONE = 'system'

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
