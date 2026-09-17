import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFetchDomain } from '@/services/useFetchDomain'

describe('useFetchDomain', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ignores partial domains from runtime chart events', () => {
    vi.useFakeTimers()
    const { debouncedRefetchChartTimeSeries, domain } = useFetchDomain()

    debouncedRefetchChartTimeSeries([
      new Date('2026-01-01T00:00:00Z'),
      undefined,
    ] as any)

    expect(() => vi.runAllTimers()).not.toThrow()
    expect(domain.value).toEqual({})
  })

  it('stores the first complete domain', () => {
    vi.useFakeTimers()
    const { debouncedRefetchChartTimeSeries, domain } = useFetchDomain()
    const startTime = new Date('2026-01-01T00:00:00Z')
    const endTime = new Date('2026-01-02T00:00:00Z')

    debouncedRefetchChartTimeSeries([startTime, endTime])
    vi.runAllTimers()

    expect(domain.value).toEqual({ startTime, endTime })
  })

  it('normalizes numeric chart domains before storing them', () => {
    vi.useFakeTimers()
    const { debouncedRefetchChartTimeSeries, domain } = useFetchDomain()
    const startTime = new Date('2026-01-01T00:00:00Z')
    const endTime = new Date('2026-01-02T00:00:00Z')

    debouncedRefetchChartTimeSeries([
      startTime.getTime(),
      endTime.getTime(),
    ] as any)
    vi.runAllTimers()

    expect(domain.value).toEqual({ startTime, endTime })
  })
})
