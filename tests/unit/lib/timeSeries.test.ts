import { describe, expect, it } from 'vitest'
import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '@/lib/timeseries/timeSeriesResource'

describe('Series resource hash', () => {
  it('generates a deterministic id for equivalent resources', () => {
    const first = new Series(new SeriesUrlRequest('provider', '/timeseries'))
    const second = new Series(new SeriesUrlRequest('provider', '/timeseries'))

    expect(first.id).toBe(second.id)
    expect(first.idIsValid()).toBe(true)
  })

  it('detects when a resource changes after the id is generated', () => {
    const series = new Series(new SeriesUrlRequest('provider', '/timeseries'))
    series.resource = new SeriesUrlRequest('provider', '/other-timeseries')

    expect(series.idIsValid()).toBe(false)
  })
})
