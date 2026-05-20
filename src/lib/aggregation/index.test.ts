import { expect, test, describe } from 'vitest'
import {
  fewsAggregationLabelToDuration,
  shortLabel,
  getRelativeStartDateForLabel,
} from './index'

describe('fewsAggregationLabelToDuration', () => {
  describe('singular units', () => {
    test('should parse "1 year"', () => {
      expect(fewsAggregationLabelToDuration('1 year')).toEqual({ year: 1 })
    })

    test('should parse "1 month"', () => {
      expect(fewsAggregationLabelToDuration('1 month')).toEqual({ month: 1 })
    })

    test('should parse "1 week"', () => {
      expect(fewsAggregationLabelToDuration('1 week')).toEqual({ week: 1 })
    })

    test('should parse "1 day"', () => {
      expect(fewsAggregationLabelToDuration('1 day')).toEqual({ day: 1 })
    })

    test('should parse "1 hour"', () => {
      expect(fewsAggregationLabelToDuration('1 hour')).toEqual({ hour: 1 })
    })

    test('should parse "1 minute"', () => {
      expect(fewsAggregationLabelToDuration('1 minute')).toEqual({ minute: 1 })
    })

    test('should parse "1 second"', () => {
      expect(fewsAggregationLabelToDuration('1 second')).toEqual({ second: 1 })
    })
  })

  describe('plural units', () => {
    test('should parse "2 years"', () => {
      expect(fewsAggregationLabelToDuration('2 years')).toEqual({ year: 2 })
    })

    test('should parse "3 months"', () => {
      expect(fewsAggregationLabelToDuration('3 months')).toEqual({ month: 3 })
    })

    test('should parse "5 weeks"', () => {
      expect(fewsAggregationLabelToDuration('5 weeks')).toEqual({ week: 5 })
    })

    test('should parse "7 days"', () => {
      expect(fewsAggregationLabelToDuration('7 days')).toEqual({ day: 7 })
    })

    test('should parse "24 hours"', () => {
      expect(fewsAggregationLabelToDuration('24 hours')).toEqual({ hour: 24 })
    })

    test('should parse "60 minutes"', () => {
      expect(fewsAggregationLabelToDuration('60 minutes')).toEqual({
        minute: 60,
      })
    })

    test('should parse "30 seconds"', () => {
      expect(fewsAggregationLabelToDuration('30 seconds')).toEqual({
        second: 30,
      })
    })
  })

  describe('case-insensitive units', () => {
    test('should parse mixed case unit', () => {
      expect(fewsAggregationLabelToDuration('5 Days')).toEqual({ day: 5 })
    })
  })

  describe('large numbers', () => {
    test('should parse "365 days"', () => {
      expect(fewsAggregationLabelToDuration('365 days')).toEqual({ day: 365 })
    })

    test('should parse "1000 hours"', () => {
      expect(fewsAggregationLabelToDuration('1000 hours')).toEqual({
        hour: 1000,
      })
    })

    test('should parse "999999 seconds"', () => {
      expect(fewsAggregationLabelToDuration('999999 seconds')).toEqual({
        second: 999999,
      })
    })
  })

  describe('invalid input', () => {
    test('should return empty object for empty string', () => {
      expect(fewsAggregationLabelToDuration('')).toEqual({})
    })

    test('should return empty object for string without number', () => {
      expect(fewsAggregationLabelToDuration('days')).toEqual({})
    })

    test('should return empty object for string without unit', () => {
      expect(fewsAggregationLabelToDuration('5')).toEqual({})
    })

    test('should return empty object for unsupported unit', () => {
      expect(fewsAggregationLabelToDuration('5 decades')).toEqual({})
    })

    test('should return empty object for negative number', () => {
      expect(fewsAggregationLabelToDuration('-5 days')).toEqual({})
    })

    test('should return empty object for decimal number', () => {
      expect(fewsAggregationLabelToDuration('5.5 days')).toEqual({})
    })

    test('should return empty object for multiple spaces', () => {
      expect(fewsAggregationLabelToDuration('5  days')).toEqual({})
    })

    test('should return empty object for leading/trailing spaces', () => {
      expect(fewsAggregationLabelToDuration(' 5 days ')).toEqual({})
    })

    test('should return empty object for random text', () => {
      expect(fewsAggregationLabelToDuration('hello world')).toEqual({})
    })

    test('should return empty object for unit with prefix', () => {
      expect(fewsAggregationLabelToDuration('5 mydays')).toEqual({})
    })
  })

  describe('edge cases', () => {
    test('should handle single unit correctly without "s"', () => {
      expect(fewsAggregationLabelToDuration('1 day')).toEqual({ day: 1 })
    })

    test('should handle plural unit correctly with "s"', () => {
      expect(fewsAggregationLabelToDuration('2 days')).toEqual({ day: 2 })
    })

    test('should parse "1 weeks" with plural s even though singular', () => {
      expect(fewsAggregationLabelToDuration('1 weeks')).toEqual({ week: 1 })
    })
  })
})

describe('shortLabel', () => {
  test('should return short label for valid aggregation label', () => {
    expect(shortLabel('1 day')).toBe('1d')
  })

  test('should return short label for hours', () => {
    expect(shortLabel('2 hours')).toBe('2h')
  })

  test('should return short label for weeks', () => {
    expect(shortLabel('1 week')).toBe('1w')
  })

  test('should return empty string for invalid input (as Duration.fromObject returns empty duration)', () => {
    const result = shortLabel('invalid')
    expect(result).toBe('')
  })
})

describe('getRelativeStartDateForLabel', () => {
  test('should calculate start date for valid label and end date', () => {
    const endDate = new Date('2024-06-10')
    const result = getRelativeStartDateForLabel('5 days', endDate)
    const expected = new Date('2024-06-05')

    expect(result).toEqual(expected)
  })

  test('should calculate start date for 1 hour', () => {
    const endDate = new Date('2024-06-10T12:00:00Z')
    const result = getRelativeStartDateForLabel('1 hour', endDate)
    const expected = new Date('2024-06-10T11:00:00Z')

    expect(result).toEqual(expected)
  })

  test('should return undefined when end date is not provided', () => {
    expect(getRelativeStartDateForLabel('5 days', undefined)).toBeUndefined()
  })

  test('should return undefined for invalid label', () => {
    const endDate = new Date('2024-06-10')
    expect(getRelativeStartDateForLabel('invalid', endDate)).toBeUndefined()
  })

  test('should return undefined for empty label', () => {
    const endDate = new Date('2024-06-10')
    expect(getRelativeStartDateForLabel('', endDate)).toBeUndefined()
  })

  test('should calculate start date for 1 week', () => {
    const endDate = new Date('2024-06-10')
    const result = getRelativeStartDateForLabel('1 week', endDate)
    const expected = new Date('2024-06-03')

    expect(result).toEqual(expected)
  })

  test('should calculate start date for plural units', () => {
    const endDate = new Date('2024-06-10')
    const result = getRelativeStartDateForLabel('10 days', endDate)
    const expected = new Date('2024-05-31')

    expect(result).toEqual(expected)
  })
})
