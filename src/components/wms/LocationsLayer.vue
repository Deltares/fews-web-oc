<template>
  <MapboxLayer
    v-if="showLocationsLayer"
    id="location-layer"
    :source="locationsLayerSource"
    :options="locationsLayerOptions"
  />
  <v-chip class="locations-layer__chip" pill label>
    <v-icon>mdi-map-marker</v-icon>
    <v-switch
      class="ml-2 mt-5"
      color="primary"
      :model-value="showLocationsLayer"
      @update:model-value="onShowLocationsLayerChange"
    />
  </v-chip>
</template>

<script setup lang="ts">
import { Ref, ref, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchLocationsAsGeoJson } from '@/lib/topology'
import { Location } from '@deltares/fews-pi-requests'
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import {
  Map,
  GeoJSONSource,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
} from 'mapbox-gl'

import useLocationsLayer from '@/services/useLocationsLayer'

interface Props {
  filterIds: string[]
  locationId?: string | null
}
const props = withDefaults(defineProps<Props>(), {
  filterIds: () => {
    return []
  },
  locationId: null,
})

const emit = defineEmits(['click'])

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { map } = useMap() as { map: Ref<Map> }

const locationsGeoJson = ref<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, Location>
>({
  type: 'FeatureCollection',
  features: [],
})

const showLocationsLayer = ref<boolean>(true)
const { locationsLayerOptions } = useLocationsLayer(locationsGeoJson)
const locationsLayerSource = 'location-layer'

map.value.on('click', 'location-layer', (e) => {
  const features = map.value.queryRenderedFeatures(e.point, {
    layers: ['location-layer'],
  })
  if (!features.length) return

  onLocationClick(e)
})

map.value.on('mouseenter', 'location-layer', () => {
  map.value.getCanvas().style.cursor = 'pointer'
})

map.value.on('mouseleave', 'location-layer', () => {
  map.value.getCanvas().style.cursor = ''
})

watchEffect(() => {
  highlightSelectedLocationOnMap()
})

watchEffect(async () => {
  if (!props.filterIds) return
  locationsGeoJson.value = await fetchLocationsAsGeoJson(
    baseUrl,
    props.filterIds,
  )
  const source = map.value.getSource(locationsLayerSource) as GeoJSONSource
  if (source) {
    source.setData(locationsGeoJson.value)
  }
})

function highlightSelectedLocationOnMap() {
  if (!map.value.getSource(locationsLayerSource)) return

  // Set color to default if no layer is available
  const locationId = props.locationId ?? 'noLayerSelected'
  map.value.setPaintProperty(locationsLayerSource, 'circle-color', [
    'match',
    ['get', 'locationId'],
    locationId,
    '#0c1e38', // color for selected location
    '#dfdfdf', // default color
  ])
  map.value.setPaintProperty(locationsLayerSource, 'circle-stroke-color', [
    'match',
    ['get', 'locationId'],
    locationId,
    'white', // stroke color for selected location
    'black', // default stroke color
  ])
  map.value.setPaintProperty(locationsLayerSource, 'circle-radius', [
    'match',
    ['get', 'locationId'],
    locationId,
    7, // radius for selected location
    5, // default radius
  ])
}

function onShowLocationsLayerChange(): void {
  showLocationsLayer.value = !showLocationsLayer.value
}

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('click', event)
}
</script>

<style scoped>
.locations-layer__chip {
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  top: 10px;
  left: 10px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
