import { DateTime, Duration, Interval } from 'luxon'
import { getDisplayTimeZone } from '@/lib/date/timeZone'

/** The calendar unit a period is aligned to, or `time` for any period. */
export type PeriodPrecision = 'year' | 'month' | 'day' | 'time'

const rangeFormatOptions: Record<PeriodPrecision, Intl.DateTimeFormatOptions> =
  {
    year: { year: 'numeric' },
    month: { month: 'short', year: 'numeric' },
    day: { day: 'numeric', month: 'short', year: 'numeric' },
    time: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    },
  }

function toDateTime(date: Date): DateTime {
  return DateTime.fromJSDate(date, {
    zone: getDisplayTimeZone() ?? 'system',
  })
}

/**
 * Returns the coarsest calendar unit of which the period covers whole units in
 * the display time zone, e.g. `month` for 1 October 00:00 until the end of
 * 31 December. The end is exclusive; `time` for other periods.
 */
export function getPeriodPrecision(start: Date, end: Date): PeriodPrecision {
  const startDateTime = toDateTime(start)
  const endDateTime = toDateTime(end)
  if (+startDateTime.startOf('day') !== +startDateTime) return 'time'
  if (+endDateTime.startOf('day') !== +endDateTime) return 'time'
  if (+startDateTime.startOf('year') === +startDateTime) {
    if (+endDateTime.startOf('year') === +endDateTime) return 'year'
  }
  if (+startDateTime.startOf('month') === +startDateTime) {
    if (+endDateTime.startOf('month') === +endDateTime) return 'month'
  }
  return 'day'
}

/**
 * Formats a period in the display time zone, writing parts that the start and
 * the inclusive end share once, e.g. `23–30 Oct 2026` or `Oct 2025 – Mar 2026`.
 * @param start - The start of the period.
 * @param end - The exclusive end of the period.
 * @param locale - The locale to format with.
 * @param precision - The precision to format with, defaults to the precision
 * of the period.
 * @param now - When given, the year is left out for periods in its year, e.g.
 * `23–30 Oct`.
 */
export function formatPeriodRange(
  start: Date,
  end: Date,
  locale: string,
  precision = getPeriodPrecision(start, end),
  now?: Date,
): string {
  // Whole days, months or years end on the last day of the period
  const lastDate =
    precision === 'time' ? end : new Date(Math.max(+start, +end - 1))
  const options = { ...rangeFormatOptions[precision] }
  if (precision !== 'year' && now) {
    const year = toDateTime(now).year
    if (toDateTime(start).year === year && toDateTime(lastDate).year === year) {
      delete options.year
    }
  }
  const formatter = new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: getDisplayTimeZone(),
  })
  return formatter.formatRange(start, lastDate)
}

const durationUnits = ['years', 'months', 'days', 'hours', 'minutes'] as const

/**
 * Formats the duration of a period in a single unit in the display time zone,
 * the largest unit with at least two or a whole number of it, rounded, e.g.
 * `7 days`, `1 month`, `18 months` or `26 hours`.
 * @param start - The start of the period.
 * @param end - The exclusive end of the period.
 * @param locale - The locale to format with.
 */
export function formatPeriodDuration(
  start: Date,
  end: Date,
  locale: string,
): string {
  const interval = Interval.fromDateTimes(toDateTime(start), toDateTime(end))
  for (const unit of durationUnits) {
    const value = interval.length(unit)
    const isWhole = value >= 1 && Math.abs(value - Math.round(value)) < 1e-9
    if (value >= 2 || isWhole || unit === 'minutes') {
      return Duration.fromObject(
        { [unit]: Math.round(value) },
        { locale },
      ).toHuman({ unitDisplay: 'long' })
    }
  }
  return ''
}
