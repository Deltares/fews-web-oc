import { afterEach, describe, expect, test } from 'vitest'
import { getDateBoundaryUnit, toMultiScaleDateLabel } from '.'
import { setDisplayTimeZone, SYSTEM_TIME_ZONE } from './timeZone'

afterEach(() => {
  setDisplayTimeZone(SYSTEM_TIME_ZONE)
})

describe('toMultiScaleDateLabel', () => {
  // Local dates, as d3 time scales use local time
  test.each([
    ['year', new Date(2025, 0, 1), '2025'],
    ['month', new Date(2025, 2, 1), 'Mar'],
    ['day', new Date(2025, 2, 6), '6 Mar'],
    ['hour', new Date(2025, 2, 6, 15), '15:00'],
    ['minute', new Date(2025, 2, 6, 15, 30), '15:30'],
    ['second', new Date(2025, 2, 6, 15, 30, 45), '15:30:45'],
    ['midnight', new Date(2025, 2, 6, 0), '6 Mar'],
  ])('shows the %s', (_, date, expected) => {
    expect(toMultiScaleDateLabel(date, date, 'en-GB')).toBe(expected)
  })

  test('formats the date with the unit of the boundary', () => {
    const date = new Date(2025, 2, 6, 1)
    const boundary = new Date(2025, 2, 6)
    expect(toMultiScaleDateLabel(date, boundary, 'en-GB')).toBe('6 Mar')
  })

  test('labels of consecutive daily ticks differ', () => {
    const labels = [5, 6, 7].map((day) =>
      toMultiScaleDateLabel(new Date(2025, 2, day), undefined, 'en-GB'),
    )
    expect(new Set(labels).size).toBe(3)
  })
})

describe('getDateBoundaryUnit', () => {
  test.each([
    [new Date(2025, 0, 1), 'year'],
    [new Date(2025, 2, 1), 'month'],
    [new Date(2025, 2, 6), 'day'],
    [new Date(2025, 2, 6, 15), 'hour'],
    [new Date(2025, 2, 6, 15, 30), 'minute'],
    [new Date(2025, 2, 6, 15, 30, 45), 'second'],
    [new Date(2025, 2, 6, 0, 0, 0, 500), 'second'],
  ])('%s is a %s boundary', (date, expected) => {
    expect(getDateBoundaryUnit(date)).toBe(expected)
  })
})

describe('in a display time zone', () => {
  test.each([
    ['UTC', '2025-03-06T00:00:00Z', 'day', '6 Mar'],
    ['UTC', '2025-03-01T00:00:00Z', 'month', 'Mar'],
    ['Asia/Tokyo', '2025-03-05T15:00:00Z', 'day', '6 Mar'],
    ['Asia/Tokyo', '2025-03-06T00:00:00Z', 'hour', '09:00'],
    ['America/New_York', '2025-01-01T05:00:00Z', 'year', '2025'],
  ])('in %s, %s is a %s boundary', (timeZone, iso, unit, label) => {
    setDisplayTimeZone(timeZone)
    const date = new Date(iso)

    expect(getDateBoundaryUnit(date)).toBe(unit)
    expect(toMultiScaleDateLabel(date, date, 'en-GB')).toBe(label)
  })
})
