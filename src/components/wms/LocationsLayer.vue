<template>
  <LocationsFillLayer
    :layerId="mapIds.location.layer.fill"
    :sourceId="mapIds.location.source"
    :source="source"
    :selectedLocationIds="selectedLocationIds"
    :isDark="isDark"
    :hoveredStateId="hoveredStateId"
  />

  <LocationsCircleLayer
    :layerId="mapIds.location.layer.circle"
    :sourceId="mapIds.location.source"
    :source="source"
  />

  <LocationsSymbolLayer
    :layerId="mapIds.location.layer.symbol"
    :sourceId="mapIds.location.source"
    :isDark="isDark"
    :source="source"
  />
  <LocationsSymbolLayer
    :layerId="mapIds.location.layer.childSymbol"
    :sourceId="mapIds.location.source"
    :isDark="isDark"
    :source="source"
    child
  />

  <LocationsTextLayer
    :layerId="mapIds.location.layer.text"
    :sourceId="mapIds.location.source"
    :source="source"
    :isDark="isDark"
  />

  <LocationsMarkers :geojson="geojson" />
</template>

<script setup lang="ts">
import LocationsFillLayer from '@/components/wms/locations/LocationsFillLayer.vue'
import LocationsCircleLayer from '@/components/wms/locations/LocationsCircleLayer.vue'
import LocationsSymbolLayer from '@/components/wms/locations/LocationsSymbolLayer.vue'
import LocationsTextLayer from '@/components/wms/locations/LocationsTextLayer.vue'
import LocationsMarkers from '@/components/wms/locations/LocationsMarkers.vue'
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
  mapIds,
  clickableLocationLayerIds,
  addPropertiesToLocationGeojson,
} from '@/lib/map'
import { useMap } from '@/services/useMap'
import { useSource } from '@/services/useLayer'

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
  selectedLocationIds: () => [],
})

const showNames = computed(() => {
  return Boolean(settings.get('ui.map.showLocationNames')?.value)
})

const showDataAvailability = computed(() => {
  return Boolean(settings.get('ui.map.showDataAvailability')?.value)
})

const geojson = computed(() =>
  addPropertiesToLocationGeojson(
    props.locationsGeoJson,
    props.selectedLocationIds,
    showNames.value,
    showDataAvailability.value,
  ),
)

const emit = defineEmits(['click'])

const { source } = useSource(mapIds.location.source, () => ({
  type: 'geojson',
  data: geojson.value,
}))

watch(geojson, () => {
  addLocationIcons()
})

onBeforeMount(() => {
  addHooksToMapObject()
  addLocationIcons()
})

onBeforeUnmount(() => {
  removeHooksFromMapObject()
})

watch(
  () => props.locationsClickable,
  () => {
    removeHooksFromMapObject()
    addHooksToMapObject()
  },
)

async function addLocationIcons() {
  if (!map) return

  addLocationIconsToMap(map, geojson.value).catch((error) =>
    console.error(`Failed to add location icons to the map: ${error}`),
  )
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
    // Sort by properties.sortKey and the order of the layers
    features.sort((a, b) => {
      const aLayerIndex = layers.indexOf(a.layer.id)
      const bLayerIndex = layers.indexOf(b.layer.id)
      if (aLayerIndex !== bLayerIndex) {
        return aLayerIndex - bLayerIndex
      }
      return b.properties.sortKey - a.properties.sortKey
    })
    event.features = features
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

function addHooksToMapObject() {
  if (map) {
    if (props.locationsClickable) {
      for (const layerId of clickableLocationLayerIds) {
        map.on('click', layerId, clickHandler)
        map.on('mouseenter', layerId, setCursorPointer)
        map.on('mouseleave', layerId, unsetCursorPointer)
      }
    }

    map.on('mousemove', mapIds.location.layer.fill, onFillMouseMove)
    map.on('mouseleave', mapIds.location.layer.fill, onFillMouseLeave)
    map.on('style.load', addLocationIcons)
  }
}

function removeHooksFromMapObject() {
  if (map) {
    for (const layerId of clickableLocationLayerIds) {
      map.off('click', layerId, clickHandler)
      map.off('mouseenter', layerId, setCursorPointer)
      map.off('mouseleave', layerId, unsetCursorPointer)
    }

    map.on('mousemove', mapIds.location.layer.fill, onFillMouseMove)
    map.on('mouseleave', mapIds.location.layer.fill, onFillMouseLeave)
    map.off('style.load', addLocationIcons)
  }
}
</script>
