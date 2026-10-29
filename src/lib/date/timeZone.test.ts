import { afterEach, describe, expect, test } from 'vitest'
import { DateTime, Settings } from 'luxon'
import { effect } from 'vue'
import {
  getDisplayTimeZone,
  isValidTimeZone,
  setDisplayTimeZone,
  SYSTEM_TIME_ZONE,
  toDisplayDateTime,
  toDisplayLocaleString,
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
