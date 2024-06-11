import { expect, test } from 'vitest'

import { convertFewsPiDateTimeToJsDate } from '.'

test('parses a FEWS PI date/time object to a Date object without timezone offset', () => {
  const fewsDatetime = { date: '2021-07-01', time: '12:00:00' }
  const result = convertFewsPiDateTimeToJsDate(fewsDatetime, 'Z')
  expect(result).toEqual(new Date('2021-07-01T12:00:00Z'))
})

test('parses a FEWS PI date/time object to a Date object with a timezone offset', () => {
  const fewsDatetime = { date: '2021-07-01', time: '12:00:00' }
  const result = convertFewsPiDateTimeToJsDate(fewsDatetime, '+02:00')
  expect(result).toEqual(new Date('2021-07-01T12:00:00+02:00'))
})
