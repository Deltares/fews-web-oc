import { applyTimeSeriesQueryOptions } from '@deltares/fews-web-oc-composables/dist/lib/timeseries/applyTimeSeriesQueryOptions.js'
import { describe, expect, it } from 'vitest'

describe('applyTimeSeriesQueryOptions', () => {
  it('omits invalid query dates', () => {
    const url = applyTimeSeriesQueryOptions(
      new URL('https://example.com/time'),
      {
        startTime: new Date(Number.NaN),
        endTime: new Date(Number.NaN),
      },
    )

    expect(url.searchParams.has('startTime')).toBe(false)
    expect(url.searchParams.has('endTime')).toBe(false)
  })

  it('preserves valid query dates', () => {
    const url = applyTimeSeriesQueryOptions(
      new URL('https://example.com/time'),
      {
        startTime: new Date('2026-11-01T00:00:00.000Z'),
        endTime: new Date('2026-11-02T00:00:00.000Z'),
      },
    )

    expect(url.searchParams.get('startTime')).toBe('2026-11-01T00:00:00Z')
    expect(url.searchParams.get('endTime')).toBe('2026-11-02T00:00:00Z')
  })
})
