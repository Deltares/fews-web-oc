import { expect, test } from 'vitest'
import { findDateIndex } from './findDateIndex'

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
