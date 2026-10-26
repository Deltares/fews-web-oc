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
        const x: (Date | number)[] = []
        const y: (number | null)[] = []
        for (const event of resource.data ?? []) {
          if (event.x === null || !Number.isFinite(Number(event.x))) continue
          x.push(event.x)
          y.push(
            event.y !== null &&
              Number.isFinite(event.y) &&
              isReliableData(event)
              ? event.y
              : null,
          )
        }
        const existing = stores.value[id]

        if (existing) {
          // Replacement snapshots may include corrections, not just new points.
          let preservesPrefix = x.length >= existing.length
          for (
            let index = 0;
            preservesPrefix && index < existing.length;
            index++
          ) {
            preservesPrefix =
              Number(x[index]) === existing.xAt(index) &&
              Object.is(y[index] ?? Number.NaN, existing.yAt(index))
          }
          if (!preservesPrefix) {
            existing.replace({ x, y })
          } else if (x.length > existing.length) {
            existing.append({
              x: x.slice(existing.length),
              y: y.slice(existing.length),
            })
          }
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
