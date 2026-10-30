import { DateTime } from 'luxon'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { setDisplayTimeZone } from '@/lib/date/timeZone'
import {
  formatOpenPeriod,
  formatPeriodDuration,
  formatPeriodRange,
  getPeriodPrecision,
} from './periodLabel'

beforeEach(() => setDisplayTimeZone('Europe/Amsterdam'))
afterEach(() => setDisplayTimeZone('system'))

// Midnight in Europe/Amsterdam
const midnight = (date: string) =>
  DateTime.fromISO(date, { zone: 'Europe/Amsterdam' }).toJSDate()

// Intl puts (thin) spaces around range dashes depending on the ICU version
const formatRange = (...args: Parameters<typeof formatPeriodRange>) =>
  formatPeriodRange(...args).replace(/\s/g, ' ')

describe('getPeriodPrecision', () => {
  test('finds whole years, months and days in the display time zone', () => {
    expect(
      getPeriodPrecision(midnight('2025-01-01'), midnight('2027-01-01')),
    ).toBe('year')
    expect(
      getPeriodPrecision(midnight('2025-12-01'), midnight('2026-02-01')),
    ).toBe('month')
    expect(
      getPeriodPrecision(midnight('2026-12-23'), midnight('2026-12-31')),
    ).toBe('day')
    expect(
      getPeriodPrecision(
        new Date('2026-12-23T10:30:00+01:00'),
        midnight('2026-12-31'),
      ),
    ).toBe('time')
  })

  test('uses the display time zone', () => {
    setDisplayTimeZone('UTC')
    expect(
      getPeriodPrecision(midnight('2025-12-01'), midnight('2026-02-01')),
    ).toBe('time')
  })
})

describe('formatPeriodRange', () => {
  test('writes shared parts once', () => {
    expect(
      formatRange(midnight('2026-12-23'), midnight('2026-12-31'), 'en-GB'),
    ).toBe('23 – 30 Dec 2026')
    expect(
      formatRange(midnight('2025-12-01'), midnight('2026-03-01'), 'en-GB'),
    ).toBe('Dec 2025 – Feb 2026')
    expect(
      formatRange(midnight('2025-01-01'), midnight('2027-01-01'), 'en-GB'),
    ).toBe('2025 – 2026')
  })

  test('formats a single unit without a range', () => {
    expect(
      formatRange(midnight('2026-12-01'), midnight('2027-01-01'), 'en-GB'),
    ).toBe('Dec 2026')
    expect(
      formatRange(midnight('2026-12-23'), midnight('2026-12-24'), 'en-GB'),
    ).toBe('23 Dec 2026')
  })

  test('leaves out the year for periods in the current year', () => {
    const now = midnight('2026-12-31')
    expect(
      formatRange(
        midnight('2026-12-23'),
        midnight('2026-12-31'),
        'en-GB',
        undefined,
        now,
      ),
    ).toBe('23 – 30 Dec')
    expect(
      formatRange(
        midnight('2025-12-01'),
        midnight('2026-03-01'),
        'en-GB',
        undefined,
        now,
      ),
    ).toBe('Dec 2025 – Feb 2026')
  })

  test('formats other periods with the time', () => {
    expect(
      formatRange(
        new Date('2026-12-23T10:30:00+01:00'),
        new Date('2026-12-23T18:00:00+01:00'),
        'en-GB',
      ),
    ).toBe('23 Dec 2026, 10:30–18:00')
  })
})

describe('formatOpenPeriod', () => {
  const now = new Date('2026-12-23T10:30:00+01:00')

  test('writes now for the missing end', () => {
    expect(
      formatOpenPeriod(
        midnight('2026-12-16'),
        undefined,
        'en-GB',
        'now',
        'day',
      ),
    ).toBe('16 Dec 2026 – now')
  })

  test('writes now for the missing start', () => {
    // The end is exclusive, whole days end on the day before
    expect(
      formatOpenPeriod(
        undefined,
        midnight('2026-12-31'),
        'en-GB',
        'now',
        'day',
      ),
    ).toBe('now – 30 Dec 2026')
  })

  test('formats the date with the time by default', () => {
    expect(
      formatOpenPeriod(
        new Date('2026-12-16T10:30:00+01:00'),
        undefined,
        'en-GB',
        'now',
      ),
    ).toBe('16 Dec 2026, 10:30 – now')
    expect(
      formatOpenPeriod(
        undefined,
        new Date('2026-12-30T10:30:00+01:00'),
        'en-GB',
        'now',
      ),
    ).toBe('now – 30 Dec 2026, 10:30')
  })

  test('leaves out the year for a date in the current year', () => {
    expect(
      formatOpenPeriod(
        midnight('2026-12-16'),
        undefined,
        'en-GB',
        'now',
        'day',
        now,
      ),
    ).toBe('16 Dec – now')
    expect(
      formatOpenPeriod(
        undefined,
        midnight('2027-01-06'),
        'en-GB',
        'now',
        'day',
        now,
      ),
    ).toBe('now – 5 Jan 2027')
  })

  test('uses the display time zone', () => {
    setDisplayTimeZone('UTC')
    expect(
      formatOpenPeriod(
        midnight('2026-12-16'),
        undefined,
        'en-GB',
        'now',
        'day',
      ),
    ).toBe('15 Dec 2026 – now')
  })

  test('writes only now without a start and end', () => {
    expect(formatOpenPeriod(undefined, undefined, 'en-GB', 'now')).toBe('now')
  })
})

describe('formatPeriodDuration', () => {
  test('uses a single rounded unit', () => {
    expect(
      formatPeriodDuration(
        midnight('2026-12-23'),
        midnight('2026-12-31'),
        'en-GB',
      ),
    ).toBe('8 days')
    expect(
      formatPeriodDuration(
        midnight('2025-01-01'),
        midnight('2026-07-01'),
        'en-GB',
      ),
    ).toBe('18 months')
    expect(
      formatPeriodDuration(
        new Date('2026-12-23T10:30:00+01:00'),
        new Date('2026-12-24T12:30:00+01:00'),
        'en-GB',
      ),
    ).toBe('26 hours')
  })

  test('rounds to the nearest whole unit', () => {
    expect(
      formatPeriodDuration(
        midnight('2025-10-31'),
        midnight('2026-10-30'),
        'en-GB',
      ),
    ).toBe('12 months')
    expect(
      formatPeriodDuration(
        midnight('2026-12-01'),
        midnight('2027-01-01'),
        'en-GB',
      ),
    ).toBe('1 month')
  })

  test('is translated', () => {
    expect(
      formatPeriodDuration(
        midnight('2026-12-23'),
        midnight('2026-12-31'),
        'de',
      ),
    ).toBe('8 Tage')
  })
})
