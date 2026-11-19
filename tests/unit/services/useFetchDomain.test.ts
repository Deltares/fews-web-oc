import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useChartZoom, useFetchDomain } from '@/services/useFetchDomain'

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

  it('clears the zoom override and pending requests on a reset', () => {
    vi.useFakeTimers()
    const { debouncedRefetchChartTimeSeries, domain, resetDomain } =
      useFetchDomain()
    const zoomed: [Date, Date] = [
      new Date('2026-01-10T00:00:00Z'),
      new Date('2026-01-20T00:00:00Z'),
    ]
    debouncedRefetchChartTimeSeries(zoomed)
    vi.runAllTimers()
    expect(domain.value).toEqual({ startTime: zoomed[0], endTime: zoomed[1] })

    resetDomain()
    expect(domain.value).toEqual({})

    debouncedRefetchChartTimeSeries(zoomed)
    resetDomain()
    vi.runAllTimers()
    expect(domain.value).toEqual({})
  })
})

describe('useChartZoom', () => {
  const day = 24 * 60 * 60 * 1000
  const range = (start: number, end: number): [Date, Date] => [
    new Date(start * day),
    new Date(end * day),
  ]

  function setup() {
    vi.useFakeTimers()
    const period = ref(range(0, 10))
    const key = ref(0)
    const zoom = useChartZoom({ period, periodKey: key })
    zoom.visibleDomain.value = range(2, 4)
    vi.runAllTimers()
    return { period, key, ...zoom }
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches the zoom and the whole period again after a reset', () => {
    const { visibleDomain, fetchDomain } = setup()
    expect(fetchDomain.value).toEqual({
      startTime: range(2, 4)[0],
      endTime: range(2, 4)[1],
    })

    visibleDomain.value = undefined
    expect(fetchDomain.value).toEqual({})
  })

  it('keeps the zoom while the period moves and overlaps it', () => {
    const { period, visibleDomain, fetchDomain } = setup()
    period.value = range(1, 11)
    expect(visibleDomain.value).toEqual(range(2, 4))
    expect(fetchDomain.value.startTime).toEqual(range(2, 4)[0])
  })

  it('shows the whole period when the zoom is outside the period', () => {
    const { period, visibleDomain, fetchDomain } = setup()
    period.value = range(5, 15)
    expect(visibleDomain.value).toBeUndefined()
    expect(fetchDomain.value).toEqual({})
  })

  it('shows the whole period when another period is selected', async () => {
    const { key, visibleDomain, fetchDomain } = setup()
    key.value++
    expect(visibleDomain.value).toBeUndefined()
    expect(fetchDomain.value).toEqual({})

    visibleDomain.value = range(2, 4)
    await nextTick()
    expect(visibleDomain.value).toEqual(range(2, 4))
  })

  it('does not request a pending zoom after a period selection', () => {
    vi.useFakeTimers()
    const key = ref(0)
    const { visibleDomain, fetchDomain } = useChartZoom({
      period: range(0, 10),
      periodKey: key,
    })
    visibleDomain.value = range(2, 4)
    key.value++
    vi.runAllTimers()
    expect(fetchDomain.value).toEqual({})
  })
})
