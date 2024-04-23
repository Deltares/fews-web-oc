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
