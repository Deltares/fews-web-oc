/**
 * Combines multiple arrays of dates into one array of dates.
 * @param arrays - The arrays of dates.
 * @returns An array of dates that contains all unique dates from all arrays.
 * @example
 * const dates1 = [new Date('2021-01-01'), new Date('2021-01-02')]
 * const dates2 = [new Date('2021-01-02'), new Date('2021-01-03')]
 * const dates3 = [new Date('2021-01-03'), new Date('2021-01-04')]
 * const combinedDates = getCombinedDates(dates1, dates2, dates3)
 * // Returns [new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-03'), new Date('2021-01-04')]
 */
export function getCombinedDates(...arrays: Date[][]): Date[] {
  const allDates = arrays.flat()
  return getUniqueDates(allDates)
}

/**
 * Sorts an array of dates in ascending order.
 * @param dates - The array of dates to sort.
 * @returns An array of dates sorted in ascending order.
 * @example
 * const dates = [new Date('2021-01-02'), new Date('2021-01-01')]
 * const sortedDates = sortDates(dates)
 * // Returns [new Date('2021-01-01'), new Date('2021-01-02')]
 */
export function getSortedDates(dates: Date[]): Date[] {
  return dates.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Removes duplicate dates from an array of dates.
 * @param dates - The array of dates.
 * @returns An array of dates that contains only unique dates.
 * @example
 * const dates = [new Date('2021-01-01'), new Date('2021-01-02'), new Date('2021-01-02')]
 * const uniqueDates = uniqueDates(dates)
 * // Returns [new Date('2021-01-01'), new Date('2021-01-02')]
 */
export function getUniqueDates(dates: Date[]): Date[] {
  return Array.from(new Set(dates.map((date) => date.getTime()))).map(
    (time) => new Date(time),
  )
}

/**
 * Finds the index of a target date in an array of dates using bisection.
 * @param dates - The array of dates to search in.
 * @param targetDate - The target date to find the index of.
 * @returns The index of the target date in the array, or the length of the array if the target date is not found.
 */
export function findDateIndex(dates: Date[], targetDate: Date): number {
  let left = 0
  let right = dates.length - 1

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    if (dates[mid].getTime() === targetDate.getTime()) {
      return mid
    } else if (dates[mid] < targetDate) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return left
}
