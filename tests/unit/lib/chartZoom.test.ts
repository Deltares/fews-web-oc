import { describe, expect, it } from 'vitest'
import { shouldKeepVisibleTimeRange } from '@/lib/charts/zoom'

const day = 24 * 60 * 60 * 1000
const previousDefault: [Date, Date] = [
  new Date('2026-11-10T00:00:00Z'),
  new Date('2026-11-17T00:00:00Z'),
]
// A running period one minute later
const nextDefault: [Date, Date] = [
  new Date(previousDefault[0].getTime() + 60_000),
  new Date(previousDefault[1].getTime() + 60_000),
]
const zoomed: [Date, Date] = [
  new Date('2026-11-12T00:00:00Z'),
  new Date('2026-11-13T00:00:00Z'),
]

describe('shouldKeepVisibleTimeRange', () => {
  it('keeps a zoomed range that overlaps the next default range', () => {
    expect(
      shouldKeepVisibleTimeRange(zoomed, previousDefault, nextDefault),
    ).toBe(true)
  })

  it('keeps a range that only partially overlaps the next default range', () => {
    const panned: [Date, Date] = [
      new Date(previousDefault[0].getTime() - day),
      new Date(previousDefault[0].getTime() + day),
    ]
    expect(
      shouldKeepVisibleTimeRange(panned, previousDefault, nextDefault),
    ).toBe(true)
  })

  it('follows the default range when the previous default range was shown', () => {
    expect(
      shouldKeepVisibleTimeRange(previousDefault, previousDefault, nextDefault),
    ).toBe(false)
  })

  it('treats sub-millisecond differences as the default range', () => {
    const visible = [
      previousDefault[0].getTime() + 0.5,
      previousDefault[1].getTime() - 0.5,
    ]
    expect(
      shouldKeepVisibleTimeRange(visible, previousDefault, nextDefault),
    ).toBe(false)
  })

  it('shows the next default range when the zoom no longer overlaps it', () => {
    const later: [Date, Date] = [
      new Date('2026-12-01T00:00:00Z'),
      new Date('2026-12-08T00:00:00Z'),
    ]
    expect(shouldKeepVisibleTimeRange(zoomed, previousDefault, later)).toBe(
      false,
    )
    const adjacent: [Date, Date] = [zoomed[1], new Date('2026-12-01T00:00:00Z')]
    expect(shouldKeepVisibleTimeRange(zoomed, previousDefault, adjacent)).toBe(
      false,
    )
  })

  it('keeps a zoom when the default range is unchanged, e.g. on a rebuild', () => {
    expect(
      shouldKeepVisibleTimeRange(zoomed, previousDefault, previousDefault),
    ).toBe(true)
  })

  it('accepts numeric ranges', () => {
    expect(shouldKeepVisibleTimeRange([2, 3], [1, 5], [1.5, 5.5])).toBe(true)
  })

  it.each([
    ['visible range', undefined, previousDefault, nextDefault],
    ['previous default', zoomed, undefined, nextDefault],
    ['next default', zoomed, previousDefault, undefined],
    [
      'invalid range',
      [new Date(Number.NaN), zoomed[1]],
      previousDefault,
      nextDefault,
    ],
    ['incomplete range', [zoomed[0]], previousDefault, nextDefault],
  ])('does not keep a range without a %s', (_name, visible, previous, next) => {
    expect(shouldKeepVisibleTimeRange(visible, previous, next)).toBe(false)
  })
})
