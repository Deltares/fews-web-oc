import { expect, test } from 'vitest'

import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesResource } from '@/lib/timeseries/timeSeriesResource'
import { SeriesResourceType } from '@/lib/timeseries/types'
import { gatherUniqueDates, transformTimeSeries } from './data'

test('gathers unique dates from multiple series', () => {
  // Dummy resource...
  const resource = new SeriesResource(SeriesResourceType.UrlRequest)

  const series1 = new Series(resource)
  series1.data = [
    { x: new Date('2021-01-01T00:00:00Z'), y: 1, flag: '0' },
    { x: new Date('2021-01-02T00:00:00Z'), y: 2, flag: '0' },
  ]
  const series2 = new Series(resource)
  series2.data = [
    { x: new Date('2021-01-02T00:00:00Z'), y: 3, flag: '0' },
    { x: new Date('2021-01-03T00:00:00Z'), y: 4, flag: '0' },
  ]

  const dates = gatherUniqueDates([series1, series2])
  expect(dates).toStrictEqual([
    new Date('2021-01-01T00:00:00Z'),
    new Date('2021-01-02T00:00:00Z'),
    new Date('2021-01-03T00:00:00Z'),
  ])
})

test('transforms an undefined series', () => {
  const dates = [
    new Date('2021-01-01T00:00:00Z'),
    new Date('2021-01-02T00:00:00Z'),
  ]

  const resource = new SeriesResource(SeriesResourceType.UrlRequest)
  const series = new Series(resource)

  const result = transformTimeSeries(series, dates)
  expect(result).toStrictEqual({
    events: [
      { date: new Date('2021-01-01T00:00:00Z'), value: null },
      { date: new Date('2021-01-02T00:00:00Z'), value: null },
    ],
  })
})

test('transforms a series with data', () => {
  const dates = [
    new Date('2021-01-01T00:00:00Z'),
    new Date('2021-01-02T00:00:00Z'),
    new Date('2021-01-03T00:00:00Z'),
    new Date('2021-01-04T00:00:00Z'),
    new Date('2021-01-05T00:00:00Z'),
  ]

  const resource = new SeriesResource(SeriesResourceType.UrlRequest)
  const series = new Series(resource)
  series.data = [
    { x: new Date('2021-01-02T00:00:00Z'), y: 1, flag: '0' },
    { x: new Date('2021-01-04T00:00:00Z'), y: 2, flag: '0' },
  ]
  series.header.unit = 'm'

  const result = transformTimeSeries(series, dates)
  expect(result).toStrictEqual({
    events: [
      { date: new Date('2021-01-01T00:00:00Z'), value: null },
      { date: new Date('2021-01-02T00:00:00Z'), value: 1 },
      { date: new Date('2021-01-03T00:00:00Z'), value: null },
      { date: new Date('2021-01-04T00:00:00Z'), value: 2 },
      { date: new Date('2021-01-05T00:00:00Z'), value: null },
    ],
    unit: 'm',
  })
})
