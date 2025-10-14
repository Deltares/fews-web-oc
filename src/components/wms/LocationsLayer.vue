<template>
  <mgl-geo-json-source :source-id="locationMapIds.source" :data="geojson">
    <LocationsFillLayer
      :layerId="locationMapIds.layer.fill"
      :selectedLocationIds="selectedLocationIds"
      :isDark="isDark"
      :hoveredStateId="hoveredStateId"
    />

    <LocationsCircleLayer :layerId="locationMapIds.layer.circle" />

    <LocationsSymbolLayer
      :layerId="locationMapIds.layer.symbol"
      :isDark="isDark"
    />
    <LocationsSymbolLayer
      :layerId="locationMapIds.layer.childSymbol"
      :isDark="isDark"
      child
    />
    <LocationsTextLayer :layerId="locationMapIds.layer.text" :isDark="isDark" />
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
  locationMapIds,
  clickableLocationLayerIds,
  addPropertiesToLocationGeojson,
} from '@/lib/map'
import { useMap } from '@/services/useMap'

const settings = useUserSettingsStore()
const isDark = useDark()
const { map } = useMap()

interface Props {
  locationsGeoJson: FeatureCollection<Geometry, Location>
  selectedLocationIds?: string[]
  locationsClickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  locationsGeoJson: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
  selectedLocationId: null,
  locationsClickable: true,
})

const showNames = computed(() => {
  return Boolean(settings.get('ui.map.showLocationNames')?.value)
})

const geojson = computed(() =>
  addPropertiesToLocationGeojson(props.locationsGeoJson, showNames.value),
)

const emit = defineEmits(['click'])

watch(geojson, () => {
  addLocationIcons()
})

onBeforeMount(() => {
  if (map) {
    if (props.locationsClickable) {
      for (const layerId of clickableLocationLayerIds) {
        map.on('click', layerId, clickHandler)
        map.on('mouseenter', layerId, setCursorPointer)
        map.on('mouseleave', layerId, unsetCursorPointer)
      }
    }

    map.on('mousemove', locationMapIds.layer.fill, onFillMouseMove)
    map.on('mouseleave', locationMapIds.layer.fill, onFillMouseLeave)
  }
  addLocationIcons()
})

onBeforeUnmount(() => {
  if (map) {
    if (props.locationsClickable) {
      for (const layerId of clickableLocationLayerIds) {
        map.off('click', layerId, clickHandler)
        map.off('mouseenter', layerId, setCursorPointer)
        map.off('mouseleave', layerId, unsetCursorPointer)
      }
    }

    map.on('mousemove', locationMapIds.layer.fill, onFillMouseMove)
    map.on('mouseleave', locationMapIds.layer.fill, onFillMouseLeave)
  }
})

function addLocationIcons() {
  if (map) addLocationIconsToMap(map, geojson.value)
}

function clickHandler(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (map && props.locationsClickable) {
    const layers = clickableLocationLayerIds.filter((layerId) =>
      map.getLayer(layerId),
    )
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
