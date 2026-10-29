import { scaleTime, scaleUtc } from 'd3-scale'
import { DateTime } from 'luxon'
import { getDisplayTimeZone } from './timeZone'

export interface SliderTick {
  /** Index of the first date at or after the tick. */
  index: number
  /** The d3 tick, aligned to a calendar boundary in the display time zone. */
  tick: Date
}

/**
 * Marks the first date at or after each tick, skipping ticks that fall
 * between the same two dates as the previous tick.
 */
function ticksToIndices(dates: Date[], ticks: Date[]): SliderTick[] {
  const result: SliderTick[] = []
  let index = 0
  for (const tick of ticks) {
    while (index < dates.length && dates[index].getTime() < tick.getTime()) {
      index++
    }
    if (index >= dates.length) break
    if (result.at(-1)?.index === index) continue
    result.push({ index, tick })
  }
  return result
}

/**
 * Returns a function that generates d3 ticks between two dates, aligned to
 * calendar boundaries in the display time zone. d3 only supports local time
 * and UTC, so for another time zone the ticks are generated in UTC for dates
 * shifted by the offset of that time zone.
 */
function zonedTicks(start: Date, end: Date): (count: number) => Date[] {
  const zone = getDisplayTimeZone()
  if (zone === undefined) {
    const scale = scaleTime().domain([start, end])
    return (count) => scale.ticks(count)
  }

  const toWallClock = (date: Date) =>
    new Date(
      date.getTime() + DateTime.fromJSDate(date, { zone }).offset * 60_000,
    )
  const fromWallClock = (date: Date) =>
    DateTime.fromISO(date.toISOString().slice(0, -1), { zone }).toJSDate()

  const scale = scaleUtc().domain([toWallClock(start), toWallClock(end)])
  return (count) => scale.ticks(count).map(fromWallClock)
}

/**
 * Selects ticks for a slider that places dates by index. All ticks use the
 * same d3 time interval, the finest one for which neighbouring ticks are at
 * least minSpacing apart, so they are equally spaced in time. Only a daylight
 * saving time transition gives one longer or shorter gap. Coarser intervals
 * are aligned to the finer ones, so e.g. day boundaries are always included.
 * @param dates - The dates of the slider, in ascending order.
 * @param width - The width of the slider in pixels.
 * @param minSpacing - The minimum distance between ticks in pixels.
 * @returns The ticks with the index of the date they are placed at.
 */
export function getEquallySpacedSliderTicks(
  dates: Date[],
  width: number,
  minSpacing: number,
): SliderTick[] {
  const lastDate = dates.at(-1)
  if (lastDate === undefined) return []
  const ticksFor = zonedTicks(dates[0], lastDate)
  const pixelsPerIndex = width / Math.max(dates.length - 1, 1)
  const fits = (ticks: SliderTick[]) =>
    ticks.every(
      (tick, i) =>
        i === 0 ||
        (tick.index - ticks[i - 1].index) * pixelsPerIndex >= minSpacing,
    )

  // d3 picks coarser intervals for lower counts, so find the highest count
  // whose ticks fit
  let ticks: SliderTick[] = []
  for (let count = Math.ceil(width / minSpacing) + 1; count >= 1; count--) {
    ticks = ticksToIndices(dates, ticksFor(count))
    if (fits(ticks)) return ticks
  }
  // Even the coarsest interval does not fit, show only the first tick
  return ticks.slice(0, 1)
}
