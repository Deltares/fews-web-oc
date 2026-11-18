import { afterEach, describe, expect, test } from 'vitest'
import { DateTime, Settings } from 'luxon'
import { effect } from 'vue'
import {
  fromDisplayDateTimeInputValue,
  fromWallClockDate,
  getDisplayTimeZone,
  isValidTimeZone,
  setDisplayTimeZone,
  SYSTEM_TIME_ZONE,
  toDisplayDateTime,
  toDisplayDateTimeInputValue,
  toDisplayLocaleString,
  toWallClockDate,
} from './timeZone'

afterEach(() => {
  setDisplayTimeZone(SYSTEM_TIME_ZONE)
})

describe('isValidTimeZone', () => {
  test.each(['system', 'UTC', 'Europe/Amsterdam', 'America/New_York'])(
    'accepts %s',
    (timeZone) => {
      expect(isValidTimeZone(timeZone)).toBe(true)
    },
  )

  test.each(['local', 'Europe/Amsterdm', 'CEST', ''])('rejects %s', (value) => {
    expect(isValidTimeZone(value)).toBe(false)
  })
})

describe('setDisplayTimeZone', () => {
  test('uses the browser time zone for system', () => {
    setDisplayTimeZone('system')

    expect(getDisplayTimeZone()).toBeUndefined()
    expect(Settings.defaultZone.type).toBe('system')
  })

  test('sets the time zone for display and Luxon', () => {
    setDisplayTimeZone('Asia/Tokyo')

    expect(getDisplayTimeZone()).toBe('Asia/Tokyo')
    const date = DateTime.fromISO('2026-01-01T00:00:00Z')
    expect(date.zoneName).toBe('Asia/Tokyo')
    expect(date.hour).toBe(9)
  })

  test('falls back to the browser time zone for an unknown time zone', () => {
    setDisplayTimeZone('UTC')
    setDisplayTimeZone('Europe/Amsterdm')

    expect(getDisplayTimeZone()).toBeUndefined()
    expect(Settings.defaultZone.type).toBe('system')
  })

  test('notifies reactive effects of a change', () => {
    const seen: (string | undefined)[] = []
    effect(() => {
      seen.push(getDisplayTimeZone())
    })

    setDisplayTimeZone('UTC')

    expect(seen).toEqual([undefined, 'UTC'])
  })
})

describe('toDisplayDateTime', () => {
  test('returns the date in the display time zone', () => {
    setDisplayTimeZone('America/New_York')
    const date = new Date('2026-01-01T03:00:00Z')

    expect(toDisplayDateTime(date).toISO()).toBe(
      '2025-12-31T22:00:00.000-05:00',
    )
    expect(toDisplayDateTime(date.getTime()).day).toBe(31)
  })
})

describe('toDisplayLocaleString', () => {
  test('formats in the display time zone', () => {
    setDisplayTimeZone('Asia/Tokyo')
    const date = new Date('2026-01-01T00:00:00Z')

    expect(
      toDisplayLocaleString(date, { hour: '2-digit', hourCycle: 'h23' }),
    ).toBe(
      date.toLocaleString(undefined, {
        hour: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Asia/Tokyo',
      }),
    )
    expect(
      toDisplayLocaleString(date, { hour: 'numeric', hourCycle: 'h23' }),
    ).toMatch(/9/)
  })
})

describe('datetime-local input values', () => {
  test('are formatted and parsed in the display time zone', () => {
    setDisplayTimeZone('Asia/Tokyo')
    const date = new Date('2026-01-01T00:00:30Z')

    expect(toDisplayDateTimeInputValue(date)).toBe('2026-01-01T09:00')
    expect(toDisplayDateTimeInputValue(date, true)).toBe('2026-01-01T09:00:30')
    expect(fromDisplayDateTimeInputValue('2026-01-01T09:00')).toEqual(
      new Date('2026-01-01T00:00:00Z'),
    )
  })

  test('are parsed in a given time zone', () => {
    setDisplayTimeZone('Asia/Tokyo')

    expect(fromDisplayDateTimeInputValue('2026-01-01T09:00', 'UTC')).toEqual(
      new Date('2026-01-01T09:00:00Z'),
    )
  })

  test('parse an invalid value as an invalid date', () => {
    expect(fromDisplayDateTimeInputValue('').getTime()).toBeNaN()
  })
})

describe('wall clock dates', () => {
  test('have the local date and time of the display time zone', () => {
    setDisplayTimeZone('America/New_York')
    const date = new Date('2026-01-01T03:04:05Z')
    const wallClock = toWallClockDate(date)

    expect([
      wallClock.getFullYear(),
      wallClock.getMonth(),
      wallClock.getDate(),
      wallClock.getHours(),
      wallClock.getMinutes(),
      wallClock.getSeconds(),
    ]).toEqual([2025, 11, 31, 22, 4, 5])
    expect(fromWallClockDate(wallClock)).toEqual(date)
  })

  test('are the date itself for the system time zone', () => {
    const date = new Date('2026-01-01T03:04:05Z')

    expect(toWallClockDate(date)).toEqual(date)
    expect(fromWallClockDate(date)).toEqual(date)
  })
})
