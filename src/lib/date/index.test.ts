import { describe, expect, test } from 'vitest'
import { convertJSDateToFewsPiParameter, toDateAbsDifferenceString } from '.'

describe('toDateAbsDifferenceString', () => {
  test('with valid dates', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-02T12:30:45Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('1d 12h')
  })
  test('with invalid start date', () => {
    const startDate = null
    const endDate = new Date('2023-10-02T12:30:45Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('—')
  })
  test('with invalid end date', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = null
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('—')
  })
  test('with both dates invalid', () => {
    const startDate = null
    const endDate = null
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('—')
  })
  test('with relative format', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-02T12:30:45Z')
    const result = toDateAbsDifferenceString(startDate, endDate, {
      relativeFormat: true,
    })
    expect(result).toBe('in 1d 12h')
  })
  test('with relative format and negative duration', () => {
    const startDate = new Date('2023-10-02T12:30:45Z')
    const endDate = new Date('2023-10-01T00:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate, {
      relativeFormat: true,
    })
    expect(result).toBe('1d 12h ago')
  })
  test('with exclude seconds', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-02T12:30:45Z')
    const result = toDateAbsDifferenceString(startDate, endDate, {
      excludeSeconds: true,
    })
    expect(result).toBe('1d 12h')
  })
  test('with zero duration', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-01T00:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('0s')
  })
  test('with negative duration', () => {
    const startDate = new Date('2023-10-02T12:30:45Z')
    const endDate = new Date('2023-10-01T00:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('1d 12h')
  })
  test('with only weeks', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-15T00:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('2w')
  })
  test('with only days', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-05T00:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('4d')
  })
  test('with only hours', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-01T05:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('5h')
  })
  test('with only minutes', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-01T00:05:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('5m')
  })
  test('with only seconds', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-01T00:00:05Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('5s')
  })
  test('with only weeks and days', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-15T00:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('2w')
  })
  test('with only days and hours', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-05T05:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('4d 5h')
  })
  test('with only hours and minutes', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-01T05:30:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('5h 30m')
  })
  test('with only minutes and seconds', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-01T00:05:30Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('5m 30s')
  })
  test('with only weeks and hours', () => {
    const startDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-08T05:00:00Z')
    const result = toDateAbsDifferenceString(startDate, endDate)
    expect(result).toBe('1w 5h')
  })
})

describe('convertJSDateToFewsPiParameter', () => {
  test('with standard date', () => {
    const date = new Date('2023-10-01T12:30:45.123Z')
    const result = convertJSDateToFewsPiParameter(date)
    expect(result).toBe('2023-10-01T12:30:45Z')
  })

  test('with midnight time', () => {
    const date = new Date('2023-10-01T00:00:00.000Z')
    const result = convertJSDateToFewsPiParameter(date)
    expect(result).toBe('2023-10-01T00:00:00Z')
  })

  test('with end of day time', () => {
    const date = new Date('2023-10-01T23:59:59.999Z')
    const result = convertJSDateToFewsPiParameter(date)
    expect(result).toBe('2023-10-01T23:59:59Z')
  })

  test('removes milliseconds', () => {
    const date = new Date('2023-10-15T14:25:36.567Z')
    const result = convertJSDateToFewsPiParameter(date)
    expect(result).not.toContain('.')
    expect(result).toBe('2023-10-15T14:25:36Z')
  })

  test('with single digit milliseconds', () => {
    const date = new Date('2023-10-15T14:25:36.001Z')
    const result = convertJSDateToFewsPiParameter(date)
    expect(result).toBe('2023-10-15T14:25:36Z')
  })

  test('check date with other timezones', () => {
    const date = new Date('2023-10-15T14:25:36.789+02:00')
    const result = convertJSDateToFewsPiParameter(date)
    expect(result).toBe('2023-10-15T12:25:36Z')
  })

  test('ends with Z', () => {
    const date = new Date('2023-10-15T14:25:36.789Z')
    const result = convertJSDateToFewsPiParameter(date)
    expect(result).toMatch(/Z$/)
  })
})
