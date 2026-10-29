import { describe, expect, test } from 'vitest'
import { getEquallySpacedSliderTicks } from './sliderTicks'

// Local dates, as d3 time scales use local time
const hourly = (start: Date, hours: number) =>
  Array.from(
    { length: hours },
    (_, i) => new Date(start.getTime() + i * 3600 * 1000),
  )

const hoursBetween = (a: Date, b: Date) =>
  (b.getTime() - a.getTime()) / 3600 / 1000

describe('getEquallySpacedSliderTicks', () => {
  test('ticks are equally spaced in time', () => {
    const dates = hourly(new Date(2025, 0, 1, 3), 4 * 24)
    const ticks = getEquallySpacedSliderTicks(dates, 1000, 100)

    expect(ticks.length).toBeGreaterThan(2)
    const gaps = ticks
      .slice(1)
      .map((t, i) => hoursBetween(ticks[i].tick, t.tick))
    expect(new Set(gaps).size).toBe(1)
  })

  test('ticks are aligned to day boundaries', () => {
    const dates = hourly(new Date(2025, 0, 1, 3), 4 * 24)
    const ticks = getEquallySpacedSliderTicks(dates, 1000, 100)

    const hours = ticks.map(({ tick }) => tick.getHours())
    expect(hours).toContain(0)
    const step = 24 / new Set(hours).size
    for (const hour of hours) expect(hour % step).toBe(0)
  })

  test('neighbouring ticks are at least the minimum spacing apart', () => {
    const dates = hourly(new Date(2025, 0, 1), 14 * 24)
    for (const width of [360, 1000, 2000]) {
      const ticks = getEquallySpacedSliderTicks(dates, width, 100)
      const pixelsPerIndex = width / (dates.length - 1)
      ticks.slice(1).forEach((t, i) => {
        expect((t.index - ticks[i].index) * pixelsPerIndex).toBeGreaterThan(
          99.99,
        )
      })
    }
  })

  test('wider sliders get more ticks', () => {
    const dates = hourly(new Date(2025, 0, 1), 14 * 24)
    const counts = [360, 1000, 2000].map(
      (width) => getEquallySpacedSliderTicks(dates, width, 100).length,
    )
    expect(counts[1]).toBeGreaterThan(counts[0])
    expect(counts[2]).toBeGreaterThan(counts[1])
  })

  test('places each tick at the first date at or after it', () => {
    // Dates every 5 hours, so most ticks fall between dates
    const dates = Array.from(
      { length: 40 },
      (_, i) => new Date(2025, 0, 1, 5 * i),
    )
    const ticks = getEquallySpacedSliderTicks(dates, 1000, 100)

    for (const { index, tick } of ticks) {
      expect(dates[index].getTime()).toBeGreaterThanOrEqual(tick.getTime())
      if (index > 0) {
        expect(dates[index - 1].getTime()).toBeLessThan(tick.getTime())
      }
    }
  })

  test('returns no ticks without dates', () => {
    expect(getEquallySpacedSliderTicks([], 1000, 100)).toEqual([])
  })
})
