<template>
  <mgl-geo-json-source :source-id="locationsSourceId" :data="geojson">
    <LocationsFillLayer
      :layerId="locationsFillLayerId"
      :selectedLocationIds="selectedLocationIds"
      :isDark="isDark"
      :hoveredStateId="hoveredStateId"
    />
    <LocationsSymbolLayer :layerId="locationsSymbolLayerId" />
    <LocationsCircleLayer :layerId="locationsCircleLayerId" />
    <LocationsTextLayer
      v-if="showNames"
      :layerId="locationsTextLayerId"
      :isDark="isDark"
    />
  </mgl-geo-json-source>

  <LocationsMarkers
    :selectedLocationIds="selectedLocationIds"
    :geojson="geojson"
  />
</template>

<script setup lang="ts">
import LocationsFillLayer from '@/components/wms/locations/LocationsFillLayer.vue'
import LocationsCircleLayer from '@/components/wms/locations/LocationsCircleLayer.vue'
import LocationsSymbolLayer from '@/components/wms/locations/LocationsSymbolLayer.vue'
import LocationsTextLayer from '@/components/wms/locations/LocationsTextLayer.vue'
import LocationsMarkers from '@/components/wms/locations/LocationsMarkers.vue'
import { MglGeoJsonSource } from '@indoorequal/vue-maplibre-gl'
import type { FeatureCollection, Geometry } from 'geojson'
import { type Location } from '@deltares/fews-pi-requests'
import {
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
} from 'maplibre-gl'
import { watch, onBeforeUnmount, computed, ref } from 'vue'
import { onBeforeMount } from 'vue'
import { addLocationIconsToMap } from '@/lib/location-icons'
import { useDark } from '@vueuse/core'
import { useUserSettingsStore } from '@/stores/userSettings'
import {
  locationsCircleLayerId,
  locationsFillLayerId,
  locationsSymbolLayerId,
  locationsSourceId,
  locationsTextLayerId,
} from '@/lib/map'
import { useMap } from '@/services/useMap'

const settings = useUserSettingsStore()
const isDark = useDark()
const { map } = useMap()

interface Props {
  locationsGeoJson: FeatureCollection<Geometry, Location>
  selectedLocationIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  locationsGeoJson: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
  selectedLocationId: null,
})

const geojson = computed<FeatureCollection<Geometry, Location>>(() => ({
  type: 'FeatureCollection',
  features: props.locationsGeoJson.features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      iconName:
        feature.properties.thresholdIconName ?? feature.properties.iconName,
      sortKey: feature.properties.thresholdIconName ? 1 : 0,
    },
  })),
}))

const emit = defineEmits(['click'])

watch(geojson, () => {
  addLocationIcons()
})

onBeforeMount(() => {
  if (map) {
    for (const layerId of [
      locationsFillLayerId,
      locationsCircleLayerId,
      locationsSymbolLayerId,
    ]) {
      map.on('click', layerId, clickHandler)
      map.on('mouseenter', layerId, setCursorPointer)
      map.on('mouseleave', layerId, unsetCursorPointer)
    }

    map.on('mousemove', locationsFillLayerId, onFillMouseMove)
    map.on('mouseleave', locationsFillLayerId, onFillMouseLeave)
  }
  addLocationIcons()
})

onBeforeUnmount(() => {
  if (map) {
    for (const layerId of [
      locationsFillLayerId,
      locationsCircleLayerId,
      locationsSymbolLayerId,
    ]) {
      map.off('click', layerId, clickHandler)
      map.off('mouseenter', layerId, setCursorPointer)
      map.off('mouseleave', layerId, unsetCursorPointer)
    }

    map.off('mousemove', locationsFillLayerId, onFillMouseMove)
    map.off('mouseleave', locationsFillLayerId, onFillMouseLeave)
  }
})

const showNames = computed(() => {
  return settings.get('ui.map.showLocationNames')?.value
})

function addLocationIcons() {
  if (map) addLocationIconsToMap(map, geojson.value)
}

function clickHandler(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (map) {
    const layers = [
      locationsSymbolLayerId,
      locationsCircleLayerId,
      locationsFillLayerId,
    ].filter((layerId) => map.getLayer(layerId))
    const features = map.queryRenderedFeatures(event.point, {
      layers,
    })
    if (!features.length) return
    // Prioratise clicks on the top-most feature
    event.features?.sort((a, b) => b.properties.sortKey - a.properties.sortKey)
    onLocationClick(event)
  }
}

function setCursorPointer() {
  if (map) map.getCanvas().style.cursor = 'pointer'
}

function unsetCursorPointer() {
  if (map) map.getCanvas().style.cursor = ''
}

const hoveredStateId = ref<string>()

function onFillMouseLeave() {
  hoveredStateId.value = undefined
}

function onFillMouseMove(
  e: MapLayerMouseEvent & { features?: MapGeoJSONFeature[] },
) {
  hoveredStateId.value = e.features?.[0].properties.locationId
}

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('click', event)
}
</script>

<style scoped>
.text-shadow {
  text-shadow: 0 0 5px var(--theme-color);
}
</style>
