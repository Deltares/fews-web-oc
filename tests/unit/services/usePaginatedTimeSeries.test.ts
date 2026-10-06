import { computed, effectScope, nextTick, ref, toValue } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  usePiTimeSeries: vi.fn(),
}))

vi.mock('@deltares/fews-web-oc-composables', () => ({
  usePiTimeSeries: mocks.usePiTimeSeries,
}))

import { usePaginatedTimeSeries } from '../../../src/services/useTimeSeries'

describe('usePaginatedTimeSeries', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

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
