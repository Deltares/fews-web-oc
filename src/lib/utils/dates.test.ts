import { expect, test, describe } from 'vitest'
import {
  getCombinedDates,
  getSortedDates,
  getUniqueDates,
  findDateIndex,
} from './dates'

describe('combineDates', () => {
  test('should combine dates', () => {
    const dates1 = [new Date('2021-01-01'), new Date('2021-01-02')]
    const dates2 = [new Date('2021-01-03'), new Date('2021-01-04')]
    const combinedDates = getCombinedDates(dates1, dates2)

    expect(combinedDates).toEqual([
      new Date('2021-01-01'),
      new Date('2021-01-02'),
      new Date('2021-01-03'),
      new Date('2021-01-04'),
    ])
  })

  test('should combine dates with duplicates', () => {
    const dates1 = [new Date('2021-01-01'), new Date('2021-01-02')]
    const dates2 = [new Date('2021-01-02'), new Date('2021-01-03')]
    const combinedDates = getCombinedDates(dates1, dates2)

    expect(combinedDates).toEqual([
      new Date('2021-01-01'),
      new Date('2021-01-02'),
      new Date('2021-01-03'),
    ])
  })

  test('should combine dates with empty arrays', () => {
    const dates1: Date[] = []
    const dates2 = [new Date('2021-01-02'), new Date('2021-01-03')]
    const combinedDates = getCombinedDates(dates1, dates2)

    expect(combinedDates).toEqual([
      new Date('2021-01-02'),
      new Date('2021-01-03'),
    ])
  })

  test('should combine dates but not sort them', () => {
    const dates1 = [new Date('2021-01-02'), new Date('2021-01-01')]
    const dates2 = [new Date('2021-01-03'), new Date('2021-01-04')]
    const combinedDates = getCombinedDates(dates1, dates2)

    expect(combinedDates).toEqual([
      new Date('2021-01-02'),
      new Date('2021-01-01'),
      new Date('2021-01-03'),
      new Date('2021-01-04'),
    ])
  })
})

describe('sortDates', () => {
  test('should sort dates', () => {
    const dates = [
      new Date('2021-01-02'),
      new Date('2021-01-01'),
      new Date('2021-01-03'),
    ]
    const sortedDates = getSortedDates(dates)

    expect(sortedDates).toEqual([
      new Date('2021-01-01'),
      new Date('2021-01-02'),
      new Date('2021-01-03'),
    ])
  })

  test('should sort dates with empty array', () => {
    const dates: Date[] = []
    const sortedDates = getSortedDates(dates)

    expect(sortedDates).toEqual([])
  })
})

describe('uniqueDates', () => {
  test('should return unique dates', () => {
    const dates = [
      new Date('2021-01-01'),
      new Date('2021-01-02'),
      new Date('2021-01-01'),
    ]
    const uniqueDates = getUniqueDates(dates)

    expect(uniqueDates).toEqual([
      new Date('2021-01-01'),
      new Date('2021-01-02'),
    ])
  })

  test('should return unique dates with empty array', () => {
    const dates: Date[] = []
    const uniqueDates = getUniqueDates(dates)

    expect(uniqueDates).toEqual([])
  })
})

describe('findDateIndex', () => {
  test('should return the index of the target date in the array', () => {
    const dates = [
      new Date('2022-01-01'),
      new Date('2022-02-01'),
      new Date('2022-03-01'),
      new Date('2022-04-01'),
    ]
    const targetDate = new Date('2022-03-01')
    const expectedIndex = 2

    const result = findDateIndex(dates, targetDate)

    expect(result).toBe(expectedIndex)
  })

  test('should return the index of the target date ISO8601', () => {
    const dates = [
      new Date('2022-01-01'),
      new Date('2022-02-01'),
      new Date('2022-03-01'),
      new Date('2022-04-01'),
    ]
    const targetDate = new Date('2022-03-01T00:00:00.000Z')
    const expectedIndex = 2

    const result = findDateIndex(dates, targetDate)

    expect(result).toBe(expectedIndex)
  })

  test('should return the index before the target date ISO8601', () => {
    const dates = [
      new Date('2022-01-01'),
      new Date('2022-02-01'),
      new Date('2022-03-01'),
      new Date('2022-04-01'),
    ]
    const targetDate = new Date('2022-03-01T00:00:00.100Z')
    const expectedIndex = 3

    const result = findDateIndex(dates, targetDate)

    expect(result).toBe(expectedIndex)
  })

  test('should return 0 if the target date is before the first date in the array', () => {
    const dates = [
      new Date('2022-02-01'),
      new Date('2022-03-01'),
      new Date('2022-04-01'),
    ]
    const targetDate = new Date('2022-01-01')
    const expectedIndex = 0
    const result = findDateIndex(dates, targetDate)
    expect(result).toBe(expectedIndex)
  })

  test('should return the last index of the array if the target date is after the latest date in the array', () => {
    const dates = [
      new Date('2022-01-01'),
      new Date('2022-02-01'),
      new Date('2022-03-01'),
      new Date('2022-04-01'),
    ]
    const targetDate = new Date('2022-05-01')
    const expectedIndex = dates.length - 1

    const result = findDateIndex(dates, targetDate)

    expect(result).toBe(expectedIndex)
  })
})
