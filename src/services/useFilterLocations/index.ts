import type { FeatureCollection, Geometry } from 'geojson'
import type { Location, LocationsFilter } from '@deltares/fews-pi-requests'
import type { Ref, MaybeRefOrGetter, ShallowRef } from 'vue'
import { ref, watch, shallowRef, toValue } from 'vue'
import {
  convertGeoJsonToFewsPiLocation,
  fetchLocationsAsGeoJson,
} from '@/lib/topology/locations'

export interface UseFilterLocationsReturn {
  error: Ref<string | undefined>
  locations: ShallowRef<Location[]>
  geojson: ShallowRef<FeatureCollection<Geometry, Location>>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

const emptyFeatureCollection: FeatureCollection<Geometry, Location> = {
  type: 'FeatureCollection',
  features: [],
}

export function useFilterLocations(
  baseUrl: string,
  filterIds: MaybeRefOrGetter<string[]>,
  filterOptions?: MaybeRefOrGetter<Partial<LocationsFilter>>,
): UseFilterLocationsReturn {
  const geojson = shallowRef<
    GeoJSON.FeatureCollection<GeoJSON.Geometry, Location>
  >(emptyFeatureCollection)

  const locations = shallowRef<Location[]>([])

  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<string | undefined>(undefined)

  watch(
    () => JSON.stringify([toValue(filterIds), toValue(filterOptions)]),
    async (_filters, _previousFilters, onCleanup) => {
      const ids = toValue(filterIds)
      const options = toValue(filterOptions)
      let active = true
      onCleanup(() => {
        active = false
      })

      geojson.value = emptyFeatureCollection
      locations.value = []
      error.value = undefined
      isReady.value = false
      isLoading.value = ids.length > 0

      try {
        if (ids.length === 0) return

        const result = await fetchLocationsAsGeoJson(baseUrl, ids, options)
        if (!active) return

        geojson.value = result
        locations.value = convertGeoJsonToFewsPiLocation(result)
      } catch {
        if (!active) return
        error.value = 'error-loading'
      } finally {
        if (active) {
          isLoading.value = false
          isReady.value = true
        }
      }
    },
    { immediate: true },
  )

  return {
    locations,
    geojson,
    isReady,
    isLoading,
    error,
  }
}
