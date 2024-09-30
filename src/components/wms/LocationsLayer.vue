<template>
  <mgl-geo-json-source :source-id="locationsSourceId" :data="geojson">
    <mgl-fill-layer
      :layer-id="locationsFillLayerId"
      :paint="paintFillSpecification"
      :filter="['==', '$type', 'Polygon']"
    />
    <mgl-symbol-layer
      :layer-id="locationsSymbolLayerId"
      :layout="layoutSymbolSpecification"
      :paint="paintSymbolSpecification"
      :filter="['all', ['has', 'iconName'], ['==', '$type', 'Point']]"
    />
    <mgl-circle-layer
      :layer-id="locationsCircleLayerId"
      :paint="paintCircleSpecification"
      :filter="['all', ['!has', 'iconName'], ['==', '$type', 'Point']]"
    />
    <mgl-symbol-layer
      v-if="showNames"
      :layer-id="locationsTextLayerId"
      :layout="layoutTextSpecification"
      :paint="paintTextSpecification"
      :filter="['==', '$type', 'Point']"
    />
  </mgl-geo-json-source>
  <mgl-marker
    v-if="selectedLocationCoordinates"
    :coordinates="selectedLocationCoordinates"
    :offset="[0, 4]"
    anchor="bottom"
  >
    <template #marker>
      <v-icon class="text-shadow" size="32px">mdi-map-marker</v-icon>
    </template>
  </mgl-marker>
</template>

<script setup lang="ts">
import {
  MglFillLayer,
  MglCircleLayer,
  MglSymbolLayer,
  MglGeoJsonSource,
  MglMarker,
  useMap,
} from '@indoorequal/vue-maplibre-gl'
import { FeatureCollection, Geometry } from 'geojson'
import { type Location } from '@deltares/fews-pi-requests'
import {
  LngLat,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
} from 'maplibre-gl'
import { watch, onBeforeUnmount, computed, ref } from 'vue'
import { onBeforeMount } from 'vue'
import { addLocationIconsToMap } from '@/lib/location-icons'
import { useDark } from '@vueuse/core'
import { useUserSettingsStore } from '@/stores/userSettings'

const settings = useUserSettingsStore()
const isDark = useDark()
const { map } = useMap()

interface Props {
  locationsGeoJson: FeatureCollection<Geometry, Location>
  selectedLocationId?: string | null
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

const selectedLocationCoordinates = computed(() => {
  const selectedLocation = geojson.value.features.find(
    (feature) => feature.properties.locationId === props.selectedLocationId,
  )
  const lat = selectedLocation?.properties.lat
  const lng = selectedLocation?.properties.lon
  if (!lat || !lng) return

  return new LngLat(+lng, +lat)
})

const layoutSymbolSpecification = {
  'icon-allow-overlap': true,
  'icon-image': ['get', 'iconName'],
  'symbol-sort-key': ['get', 'sortKey'],
}

const layoutTextSpecification = {
  'text-field': ['get', 'locationName'],
  'text-size': 12,
  'text-overlap': 'never',
  'text-padding': 10,
  'text-justify': 'auto',
  'text-variable-anchor': ['right', 'left'],
  'text-max-width': 15,
  // When overlap is false sort order has to be inverted for some reason:
  // https://maplibre.org/maplibre-style-spec/layers/#symbol-sort-key
  'symbol-sort-key': ['+', 999, ['-', ['get', 'sortKey']]],
}

const paintTextSpecification = computed(() => {
  return {
    'text-color': isDark.value ? 'rgb(255,255,255)' : 'rgb(0,0,0)',
  }
})

const defaultOpacity = 0.75

const paintSymbolSpecification = {
  'icon-opacity': defaultOpacity,
}

const paintCircleSpecification = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-opacity': defaultOpacity,
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1.5,
}

function getDarkPaintFillSpecification(selectedId: string, hoverId: string) {
  return {
    'fill-color': 'darkgrey',
    'fill-opacity': [
      'match',
      ['get', 'locationId'],
      selectedId,
      0.35,
      hoverId,
      0.3,
      0.2,
    ],
    'fill-outline-color': 'white',
  }
}

function getLightPaintFillSpecification(selectedId: string, hoverId: string) {
  return {
    'fill-color': '#dfdfdf',
    'fill-opacity': [
      'match',
      ['get', 'locationId'],
      selectedId,
      0.8,
      hoverId,
      0.6,
      0.3,
    ],
    'fill-outline-color': 'black',
  }
}

const paintFillSpecification = computed(() => {
  const selectedId = props.selectedLocationId ?? 'invalid-no-layer-selected'
  const hoverId =
    hoveredStateId.value === selectedId
      ? 'invalid-already-selected'
      : (hoveredStateId.value ?? 'invalid-no-hover')
  return isDark.value
    ? getDarkPaintFillSpecification(selectedId, hoverId)
    : getLightPaintFillSpecification(selectedId, hoverId)
})

const locationsCircleLayerId = 'location-circle-layer'
const locationsSymbolLayerId = 'location-symbol-layer'
const locationsTextLayerId = 'location-text-layer'
const locationsSourceId = 'location-source'
const locationsFillLayerId = 'location-fill-layer'

watch(geojson, () => {
  addLocationIcons()
})

onBeforeMount(() => {
  if (map) {
    for (const layerId of [
      locationsCircleLayerId,
      locationsSymbolLayerId,
      locationsFillLayerId,
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
      locationsCircleLayerId,
      locationsSymbolLayerId,
      locationsFillLayerId,
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
