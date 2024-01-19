/**
 * Finds the index of a target date in an array of dates using bisection.
 * @param dates - The array of dates to search in.
 * @param targetDate - The target date to find the index of.
 * @returns The index of the target date in the array, or the length of the array if the target date is not found.
 */
export function findDateIndex(dates: Date[], targetDate: Date): number {
  let left = 0
  let right = dates.length - 1
  console.log('target', targetDate, right)

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

// export function findDateIndex(dates: Date[], targetDate: Date): number {
//     let index = 0;
//     while (index < dates.length && dates[index] <= targetDate) {
//         index++
//     }
//     return index;
// }
