import type { FeatureCollection, Geometry } from 'geojson'
import type { Location } from '@deltares/fews-pi-requests'
import type { Ref, MaybeRefOrGetter, ShallowRef } from 'vue'
import { ref, watchEffect, shallowRef, toValue } from 'vue'
import {
  convertGeoJsonToFewsPiLocation,
  fetchLocationsAsGeoJson,
} from '@/lib/topology/locations'

export interface UseFilterLocationsReturn {
  error: Ref<any>
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
): UseFilterLocationsReturn {
  const geojson = shallowRef<
    GeoJSON.FeatureCollection<GeoJSON.Geometry, Location>
  >(emptyFeatureCollection)

  const locations = shallowRef<Location[]>([])

  const isReady = ref(false)
  const isLoading = ref(false)
  const error = shallowRef<unknown | undefined>(undefined)

  watchEffect(async () => {
    const _filterdIds = toValue(filterIds)
    if (_filterdIds.length === 0) {
      geojson.value = emptyFeatureCollection
      locations.value = convertGeoJsonToFewsPiLocation(geojson.value)
      return
    }
    await loadLocations(_filterdIds)
  })

  async function loadLocations(ids: string[]): Promise<void> {
    isLoading.value = true
    isReady.value = false
    try {
      geojson.value = await fetchLocationsAsGeoJson(baseUrl, ids)
      locations.value = convertGeoJsonToFewsPiLocation(geojson.value)
    } catch (error) {
      error = 'error-loading'
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  return {
    locations,
    geojson,
    isReady,
    isLoading,
    error,
  }
}
