import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
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

  it('clears the zoom override and pending requests when the configured period changes', () => {
    vi.useFakeTimers()
    const period = ref<[Date, Date]>([
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-02-01T00:00:00Z'),
    ])
    const scope = effectScope()
    try {
      const { debouncedRefetchChartTimeSeries, domain } = scope.run(() =>
        useFetchDomain(period),
      )!
      const zoomed: [Date, Date] = [
        new Date('2026-01-10T00:00:00Z'),
        new Date('2026-01-20T00:00:00Z'),
      ]
      debouncedRefetchChartTimeSeries(zoomed)
      vi.runAllTimers()
      expect(domain.value).toEqual({
        startTime: zoomed[0],
        endTime: zoomed[1],
      })

      period.value = [
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-02-01T00:00:00Z'),
      ]
      expect(domain.value.startTime).toEqual(zoomed[0])

      debouncedRefetchChartTimeSeries(zoomed)
      period.value = [
        new Date('2026-03-01T00:00:00Z'),
        new Date('2026-03-01T06:00:00Z'),
      ]
      expect(domain.value).toEqual({})
      vi.runAllTimers()
      expect(domain.value).toEqual({})

      debouncedRefetchChartTimeSeries(period.value)
      vi.runAllTimers()
      expect(domain.value).toEqual({
        startTime: period.value[0],
        endTime: period.value[1],
      })
    } finally {
      scope.stop()
    }
  })
})
