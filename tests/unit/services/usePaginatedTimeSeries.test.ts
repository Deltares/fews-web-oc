import { computed, effectScope, nextTick, ref, toValue } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ActionRequest } from '@deltares/fews-pi-requests'

const mocks = vi.hoisted(() => ({
  usePiTimeSeries: vi.fn(),
}))

vi.mock('@deltares/fews-web-oc-composables', () => ({
  usePiTimeSeries: mocks.usePiTimeSeries,
}))

import {
  usePaginatedTimeSeries,
  useTimeSeries,
} from '../../../src/services/useTimeSeries'

describe.each([
  { name: 'useTimeSeries', useSeries: useTimeSeries },
  { name: 'usePaginatedTimeSeries', useSeries: usePaginatedTimeSeries },
])('$name shared behavior', ({ useSeries }) => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('preserves request keys, reactive inputs, and refresh controls', () => {
    const requestRefresh = vi.fn()
    const pauseRefresh = vi.fn()
    const resumeRefresh = vi.fn()
    mocks.usePiTimeSeries.mockReturnValue({
      entries: ref({}),
      responses: ref({}),
      loading: computed(() => false),
      refreshing: computed(() => false),
      loadingKeys: computed(() => []),
      requestRefresh,
      pauseRefresh,
      resumeRefresh,
    })
    const requests = ref<ActionRequest[]>([
      { key: 'series', request: 'timeseries?existing=value#fragment' },
      { key: 'series', request: 'timeseries?other=value' },
      { request: 'timeseries?fallback=true' },
    ])
    const enabled = ref(false)
    const options = ref({ thinning: false })
    const scope = effectScope()
    const result = scope.run(() => useSeries(requests, options, enabled))!
    const piOptions = mocks.usePiTimeSeries.mock.calls[0][0]

    expect(toValue(piOptions.requests)).toEqual([
      { key: 'series', relativeUrl: 'timeseries?existing=value#fragment' },
      { key: 'series#1', relativeUrl: 'timeseries?other=value' },
      { key: 'request-2', relativeUrl: 'timeseries?fallback=true' },
    ])
    expect(toValue(piOptions.enabled)).toBe(false)
    expect(piOptions.query).toBe(options)
    expect(result.requestRefresh).toBe(requestRefresh)
    expect(result.pauseRefresh).toBe(pauseRefresh)
    expect(result.resumeRefresh).toBe(resumeRefresh)

    enabled.value = true
    requests.value = [{ key: 'updated', request: 'timeseries?updated=true' }]
    expect(toValue(piOptions.enabled)).toBe(true)
    expect(toValue(piOptions.requests)).toEqual([
      { key: 'updated', relativeUrl: 'timeseries?updated=true' },
    ])
    scope.stop()
  })

  it('converts ordinary and grid responses with missing values', () => {
    const timeSeries = {
      header: {
        stationName: 'Station',
        parameterId: 'level',
        moduleInstanceId: 'module',
        missVal: '-999',
        startDate: { date: '2025-01-01', time: '00:00:00' },
        endDate: { date: '2025-01-01', time: '00:00:00' },
      },
      events: [
        { date: '2025-01-01', time: '00:00:00', value: '12', flag: '0' },
        { date: '2025-01-01', time: '00:01:00', value: '-999', flag: '9' },
      ],
    }
    mocks.usePiTimeSeries.mockReturnValue({
      entries: ref({}),
      responses: ref({
        ordinary: { timeSeries: [timeSeries] },
        grid: { timeSeries: [timeSeries, timeSeries, { events: [] }] },
      }),
      loading: computed(() => false),
      refreshing: computed(() => false),
      loadingKeys: computed(() => []),
      requestRefresh: vi.fn(),
      pauseRefresh: vi.fn(),
      resumeRefresh: vi.fn(),
    })
    const scope = effectScope()
    const result = scope.run(() =>
      useSeries(
        [
          { key: 'ordinary', request: '/timeseries?test=true' },
          { key: 'grid', request: '/timeseries/grid?test=true' },
        ],
        {},
      ),
    )!

    expect(Object.keys(result.series.value)).toEqual([
      'ordinary',
      'grid[0]',
      'grid[1]',
    ])
    for (const series of Object.values(result.series.value)) {
      expect(series.header.name).toBe('Station - level (module)')
      expect(series.data?.map((event) => event.y)).toEqual([12, null])
      expect(series.data?.[0].x).toEqual(new Date('2025-01-01T00:00:00Z'))
    }
    scope.stop()
  })
})

describe('usePaginatedTimeSeries', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it.each(['before', 'after'] as const)(
    'stops exhausted %s loads independently and resets for changed inputs',
    async (direction) => {
      const loading = ref(false)
      const entries = ref({ series: { updatedAt: new Date(0) } })
      const responses = ref({
        series: {
          timeSeries: [
            {
              header: {
                parameterId: 'level',
                missVal: '-999',
                startDate: { date: '2025-01-01', time: '00:00:00' },
                endDate: { date: '2025-01-01', time: '00:00:00' },
              },
              events: [{ date: '2025-01-01', time: '00:00:00', value: '1' }],
            },
          ],
        },
      })
      mocks.usePiTimeSeries.mockReturnValue({
        entries,
        responses,
        loading,
        refreshing: ref(false),
        loadingKeys: computed(() => []),
        requestRefresh: vi.fn(),
        pauseRefresh: vi.fn(),
        resumeRefresh: vi.fn(),
      })
      const requests = ref([{ key: 'series', request: 'timeseries' }])
      const options = ref({ startTime: new Date('2025-01-01') })
      const scope = effectScope()
      const paginated = scope.run(() =>
        usePaginatedTimeSeries(requests, options),
      )!
      const count =
        direction === 'before'
          ? paginated.beforeStartTimeCount
          : paginated.afterEndTimeCount
      const complete = async (succeeded = true) => {
        loading.value = true
        await nextTick()
        if (succeeded) entries.value = { series: { updatedAt: new Date() } }
        loading.value = false
        await nextTick()
      }

      paginated.loadMore(direction)
      await complete(false)
      paginated.loadMore(direction)
      expect(count.value).toBe(40)
      responses.value.series.timeSeries[0].events.push({
        date: direction === 'before' ? '2024-12-31' : '2025-01-02',
        time: '00:00:00',
        value: '2',
      })
      await complete()
      paginated.loadMore(direction)
      expect(count.value).toBe(60)
      await complete()
      paginated.loadMore(direction)
      paginated.loadMore(direction)
      expect(count.value).toBe(60)
      expect(paginated.isLoadingMore.value).toBe(false)

      const opposite = direction === 'before' ? 'after' : 'before'
      paginated.loadMore(opposite)
      expect(paginated.isLoadingMore.value).toBe(true)
      await complete()

      options.value.startTime = new Date('2025-02-01')
      expect(count.value).toBe(0)
      paginated.loadMore(direction)
      expect(count.value).toBe(20)
      await complete()

      requests.value = [{ key: 'series', request: 'timeseries?changed=true' }]
      expect(count.value).toBe(0)
      paginated.loadMore(direction)
      expect(count.value).toBe(20)
      scope.stop()
    },
  )

  it('adds pagination counts to requests and prevents concurrent page loads', async () => {
    const loading = ref(false)
    const refreshing = ref(false)
    const entries = ref({ 'series-1': { updatedAt: new Date(0) } })
    mocks.usePiTimeSeries.mockReturnValue({
      entries,
      responses: computed(() => ({})),
      loading,
      refreshing,
      loadingKeys: computed(() => []),
      requestRefresh: vi.fn(),
      pauseRefresh: vi.fn(),
      resumeRefresh: vi.fn(),
    })

    const scope = effectScope()
    const paginated = scope.run(() =>
      usePaginatedTimeSeries(
        [{ key: 'series-1', request: 'timeseries?existing=value' }],
        { thinning: false },
      ),
    )!
    const requests = mocks.usePiTimeSeries.mock.calls[0][0].requests
    const getRequestUrl = () =>
      new URL(toValue(requests)[0].relativeUrl, 'http://localhost')

    expect(getRequestUrl().pathname).toBe('/timeseries')
    expect(getRequestUrl().searchParams.get('existing')).toBe('value')
    expect(getRequestUrl().searchParams.has('beforeStartTimeCount')).toBe(false)

    paginated.loadMore('before')
    expect(paginated.beforeStartTimeCount.value).toBe(20)
    expect(getRequestUrl().searchParams.get('beforeStartTimeCount')).toBe('20')

    paginated.loadMore('after')
    expect(paginated.afterEndTimeCount.value).toBe(0)

    loading.value = true
    await nextTick()
    entries.value = { 'series-1': { updatedAt: new Date() } }
    loading.value = false
    await nextTick()
    expect(paginated.pageUpdate.value).toEqual({
      revision: 1,
      direction: 'before',
    })

    paginated.loadMore('after')
    expect(paginated.afterEndTimeCount.value).toBe(20)
    expect(getRequestUrl().searchParams.get('afterEndTimeCount')).toBe('20')

    loading.value = true
    await nextTick()
    loading.value = false
    await nextTick()
    expect(paginated.pageUpdate.value).toEqual({
      revision: 1,
      direction: 'before',
    })

    scope.stop()
  })
})
