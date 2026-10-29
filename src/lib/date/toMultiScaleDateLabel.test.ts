import { describe, expect, test } from 'vitest'
import { getDateBoundaryUnit, toMultiScaleDateLabel } from '.'

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
