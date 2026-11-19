import { describe, expect, it } from 'vitest'
import { isSameTimeRange, overlapsTimeRange } from '@/lib/charts/zoom'

const period: [Date, Date] = [
  new Date('2026-11-10T00:00:00Z'),
  new Date('2026-11-17T00:00:00Z'),
]
const zoomed: [Date, Date] = [
  new Date('2026-11-12T00:00:00Z'),
  new Date('2026-11-13T00:00:00Z'),
]

describe('isSameTimeRange', () => {
  it('compares dates and epoch milliseconds within a millisecond', () => {
    expect(
      isSameTimeRange(period, [period[0].getTime() + 0.5, period[1].getTime()]),
    ).toBe(true)
    expect(isSameTimeRange(period, zoomed)).toBe(false)
  })

  it('treats missing, incomplete or invalid ranges as different', () => {
    expect(isSameTimeRange(undefined, period)).toBe(false)
    expect(isSameTimeRange([period[0]], [period[0]])).toBe(false)
    expect(isSameTimeRange([new Date(Number.NaN), period[1]], period)).toBe(
      false,
    )
  })
})

describe('overlapsTimeRange', () => {
  it('overlaps a range inside or partially inside another range', () => {
    expect(overlapsTimeRange(zoomed, period)).toBe(true)
    expect(
      overlapsTimeRange(
        [new Date('2026-11-01T00:00:00Z'), new Date('2026-11-11T00:00:00Z')],
        period,
      ),
    ).toBe(true)
    expect(overlapsTimeRange([2, 3], [1, 5])).toBe(true)
  })

  it('does not overlap a range outside or adjacent to another range', () => {
    expect(
      overlapsTimeRange(
        [new Date('2026-12-01T00:00:00Z'), new Date('2026-12-08T00:00:00Z')],
        period,
      ),
    ).toBe(false)
    expect(
      overlapsTimeRange([period[1], new Date('2026-12-01T00:00:00Z')], period),
    ).toBe(false)
  })

  it('does not overlap a missing range', () => {
    expect(overlapsTimeRange(undefined, period)).toBe(false)
    expect(overlapsTimeRange(zoomed, undefined)).toBe(false)
  })
})
