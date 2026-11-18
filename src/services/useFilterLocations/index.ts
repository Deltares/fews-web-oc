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

  function resetState(hasFilters: boolean) {
    geojson.value = emptyFeatureCollection
    locations.value = []
    error.value = undefined
    isReady.value = !hasFilters
    isLoading.value = hasFilters
  }

  async function loadLocations(
    ids: string[],
    options: Partial<LocationsFilter> | undefined,
    controller: AbortController,
  ) {
    const { signal } = controller
    try {
      const result = await fetchLocationsAsGeoJson(
        baseUrl,
        ids,
        options,
        controller,
      )
      if (signal.aborted) return

      geojson.value = result
      locations.value = convertGeoJsonToFewsPiLocation(result)
    } catch {
      if (!signal.aborted) error.value = 'error-loading'
    } finally {
      if (!signal.aborted) {
        isLoading.value = false
        isReady.value = true
      }
    }
  }

  watch(
    () => JSON.stringify([toValue(filterIds), toValue(filterOptions)]),
    (_filters, _previousFilters, onCleanup) => {
      const ids = toValue(filterIds)
      const options = toValue(filterOptions)
      const controller = new AbortController()
      onCleanup(() => controller.abort())

      resetState(ids.length > 0)
      if (ids.length === 0) return
      return loadLocations(ids, options, controller)
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
