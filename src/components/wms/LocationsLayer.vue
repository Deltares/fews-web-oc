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
    v-for="coordinates in selectedLocationsCoordinates"
    :coordinates="coordinates"
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
} from '@indoorequal/vue-maplibre-gl'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
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

const selectedLocationsCoordinates = computed(() => {
  const selectedLocations = geojson.value.features.filter((feature) =>
    props.selectedLocationIds?.includes(feature.properties.locationId),
  )

  return selectedLocations
    .flatMap(getLngLatForFeature)
    .filter((lngLat) => lngLat !== undefined)
})

function getLngLatForFeature(feature: Feature<Geometry, Location>) {
  const geometry = feature.geometry
  if (geometry.type === 'Point') {
    const lng = geometry.coordinates[0]
    const lat = geometry.coordinates[1]

    return new LngLat(lng, lat)
  }

  const properties = feature.properties
  if (properties.lon && properties.lat) {
    const lng = +properties.lon
    const lat = +properties.lat

    return new LngLat(lng, lat)
  }
}

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
    'text-halo-color': isDark.value ? 'rgb(0,0,0)' : 'rgb(255,255,255)',
    'text-halo-width': 1,
    'text-halo-blur': 1,
  }
})

const defaultOpacity = 1.0

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

function getDarkPaintFillSpecification(selectedIds: string[], hoverId: string) {
  return {
    'fill-color': 'darkgrey',
    'fill-opacity': [
      'match',
      ['get', 'locationId'],
      selectedIds,
      0.35,
      hoverId,
      0.3,
      0.2,
    ],
    'fill-outline-color': 'white',
  }
}

function getLightPaintFillSpecification(
  selectedIds: string[],
  hoverId: string,
) {
  return {
    'fill-color': '#dfdfdf',
    'fill-opacity': [
      'match',
      ['get', 'locationId'],
      selectedIds,
      0.8,
      hoverId,
      0.6,
      0.3,
    ],
    'fill-outline-color': 'black',
  }
}

const paintFillSpecification = computed(() => {
  const selectedIds = props.selectedLocationIds?.length
    ? props.selectedLocationIds
    : ['invalid-no-layer-selected']
  const hoverStateId = hoveredStateId.value ?? 'invalid-no-hover'
  const hoverId = selectedIds.includes(hoverStateId)
    ? 'invalid-already-selected'
    : hoverStateId
  return isDark.value
    ? getDarkPaintFillSpecification(selectedIds, hoverId)
    : getLightPaintFillSpecification(selectedIds, hoverId)
})

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
