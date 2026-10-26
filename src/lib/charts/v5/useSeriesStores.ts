import { createSeries, type SeriesStore } from '@deltares/fews-web-oc-charts'
import { markRaw, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import { isReliableData } from '@/lib/charts/dataFromResources'

export type SeriesStores = Readonly<Record<string, SeriesStore>>

export function useSeriesStores(
  series: MaybeRefOrGetter<Record<string, Series>>,
) {
  const stores = shallowRef<Record<string, SeriesStore>>({})

  watch(
    () =>
      Object.entries(toValue(series)).map(([id, resource]) => ({
        id,
        resource,
        data: resource.data,
        lastUpdated: resource.lastUpdated?.getTime(),
      })),
    (resources) => {
      const nextStores: Record<string, SeriesStore> = {}

      for (const { id, resource } of resources) {
        const events = (resource.data ?? []).filter((event) => event.x !== null)
        const x = events.map((event) => event.x as Date | number)
        const y = events.map((event) =>
          event.y !== null && isReliableData(event) ? event.y : null,
        )
        const existing = stores.value[id]

        if (existing) {
          existing.replace({ x, y })
          nextStores[id] = existing
        } else {
          nextStores[id] = markRaw(createSeries({ x, y }))
        }
      }

      stores.value = nextStores
    },
    { immediate: true },
  )

  return stores
}
