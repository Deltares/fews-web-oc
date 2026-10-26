import { describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '@/lib/timeseries/timeSeriesResource'
import type { SeriesData } from '@/lib/timeseries/types/SeriesData'
import { useSeriesStores } from './useSeriesStores'

function event(
  x: SeriesData['x'],
  y: SeriesData['y'],
  flag: SeriesData['flag'] = '0',
): SeriesData {
  return { x, y, flag }
}

function setup(data: SeriesData[]) {
  const resource = new Series(new SeriesUrlRequest('test', 'test'))
  resource.data = data
  const resources = ref<Record<string, Series>>({ test: resource })
  const scope = effectScope()
  const stores = scope.run(() => useSeriesStores(resources))!
  return { resources, stores, scope }
}

describe('useSeriesStores', () => {
  it('filters invalid x values and preserves gaps and reliability flags', () => {
    const { stores, scope } = setup([
      event(null, 1),
      event(new Date(Number.NaN), 1),
      event(Infinity, 1),
      event(Number.NaN, 1),
      event(new Date(1), 2),
      event(2.5, null),
      event(3, Infinity),
      event(4, Number.NaN),
      event(5, 10, '6'),
      event(6, 10, '7'),
      event(7, 10, '8'),
    ])
    try {
      const store = stores.value.test
      expect(store.length).toBe(7)
      expect(store.xAt(0)).toBe(1)
      expect(store.xAt(1)).toBe(2.5)
      expect(store.yAt(0)).toBe(2)
      for (let index = 1; index < store.length; index++) {
        expect(store.yAt(index)).toBeNaN()
      }
    } finally {
      scope.stop()
    }
  })

  it('appends only new rows from replacement snapshots and skips equal data', async () => {
    const { stores, resources, scope } = setup([
      event(new Date(1), 2),
      event(2, null),
    ])
    try {
      const store = stores.value.test
      resources.value.test.data = [
        event(1, 2),
        event(new Date(2), null),
        event(3, 4),
      ]
      await nextTick()
      expect(stores.value.test).toBe(store)
      expect(store.change).toMatchObject({
        operation: 'append',
        inputLength: 1,
      })
      expect(store.length).toBe(3)
      expect(store.yAt(2)).toBe(4)
      const version = store.version
      resources.value.test.data = [event(1, 2), event(2, null), event(3, 4)]
      await nextTick()
      expect(store.version).toBe(version)
    } finally {
      scope.stop()
    }
  })

  it.each([
    [event(1, 9), event(2, 3), event(3, 4)],
    [event(2, 3), event(3, 4)],
    [event(1, 2)],
    [],
  ])('replaces changed or shortened snapshots: %j', async (...data) => {
    const { stores, resources, scope } = setup([event(1, 2), event(2, 3)])
    try {
      const store = stores.value.test
      resources.value.test.data = data
      await nextTick()
      expect(stores.value.test).toBe(store)
      expect(store.change?.operation).toBe('replace')
      expect(store.length).toBe(data.length)
    } finally {
      scope.stop()
    }
  })

  it('observes in-place edits signalled by lastUpdated and removes absent stores', async () => {
    const { stores, resources, scope } = setup([event(1, 2)])
    try {
      const store = stores.value.test
      resources.value.test.data!.push(event(2, 3))
      resources.value.test.lastUpdated = new Date(1)
      await nextTick()
      expect(store.change?.operation).toBe('append')
      resources.value.test.data![0].flag = '6'
      resources.value.test.lastUpdated = new Date(2)
      await nextTick()
      expect(store.change?.operation).toBe('replace')
      expect(store.yAt(0)).toBeNaN()
      resources.value = {}
      await nextTick()
      expect(stores.value).toEqual({})
    } finally {
      scope.stop()
    }
  })
})
