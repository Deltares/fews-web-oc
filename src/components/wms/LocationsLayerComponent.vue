<template>
  <LocationsLayer
    v-if="showLocationsLayer && hasLocations"
    :locationsGeoJson="locationsGeoJson"
    :selectedLocationId="props.locationId"
    @click="onLocationClick"
  />
  <v-chip
    v-if="hasLocations"
    class="locations-layer__chip"
    :class="{ 'pr-0': showLocationsLayer }"
    pill
    label
  >
    <v-btn
      @click="showLocationsLayer = !showLocationsLayer"
      density="compact"
      variant="plain"
      icon
    >
      <v-icon>{{
        showLocationsLayer ? 'mdi-map-marker' : 'mdi-map-marker-off'
      }}</v-icon>
    </v-btn>
    <LocationsSearchControl
      v-if="showLocationsLayer"
      :locations="locations"
      :selectedLocationId="props.locationId"
      @changeLocationId="onLocationChange"
    />
  </v-chip>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect, computed } from 'vue'
import LocationsSearchControl from './LocationsSearchControl.vue'
import LocationsLayer from './LocationsLayer.vue'
import { configManager } from '@/services/application-config'
import { FeatureCollection, Geometry } from 'geojson'
import {
  convertGeoJsonToFewsPiLocation,
  fetchLocationsAsGeoJson,
} from '@/lib/topology'
import { type Location } from '@deltares/fews-pi-requests'
import { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'

interface Props {
  filterIds: string[]
  locationId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  filterIds: () => [],
  locationId: null,
})

const emit = defineEmits(['changeLocationId'])

const emptyFeatureCollection: FeatureCollection<Geometry, Location> = {
  type: 'FeatureCollection',
  features: [],
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const locationsGeoJson = ref<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, Location>
>(emptyFeatureCollection)

const showLocationsLayer = ref<boolean>(true)
const locations = ref<Location[]>([])

watchEffect(async () => {
  if (props.filterIds.length === 0) return
  locationsGeoJson.value = await fetchLocationsAsGeoJson(
    baseUrl,
    props.filterIds,
  )
})

watch(locationsGeoJson, () => {
  locations.value = convertGeoJsonToFewsPiLocation(locationsGeoJson.value)
})

const hasLocations = computed(() => {
  return locations.value.length > 0
})

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (!event.features) return
  const locationId: string | undefined =
    event.features[0].properties?.locationId
  if (locationId) onLocationChange(locationId)
}

function onLocationChange(locationId: string | null): void {
  emit('changeLocationId', locationId)
}
</script>

<style scoped>
.locations-layer__chip {
  font-size: 0.825em;
  z-index: 1000;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
