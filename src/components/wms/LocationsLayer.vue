<template>
  <mgl-geo-json-source :source-id="locationsSourceId" :data="geojson">
    <mgl-symbol-layer
      :layer-id="locationsSymbolLayerId"
      :layout="layoutSymbolSpecification"
      :paint="paintSymbolSpecification"
    />
    <mgl-circle-layer
      :layer-id="locationsCircleLayerId"
      :paint="paintCircleSpecification"
    />
    <mgl-symbol-layer
      v-if="showNames"
      :layer-id="locationsTextLayerId"
      :layout="layoutTextSpecification"
      :paint="paintTextSpecification"
    />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import {
  MglCircleLayer,
  MglSymbolLayer,
  MglGeoJsonSource,
  useMap,
} from '@indoorequal/vue-maplibre-gl'
import { FeatureCollection, Geometry } from 'geojson'
import { type Location } from '@deltares/fews-pi-requests'
import {
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  MapSourceDataEvent,
} from 'maplibre-gl'
import { watch, onBeforeUnmount, computed } from 'vue'
import { onBeforeMount } from 'vue'
import { addLocationIconsToMap } from '@/lib/location-icons'
import { useDark } from '@vueuse/core'
import { useUserSettingsStore } from '@/stores/userSettings'

const settings = useUserSettingsStore()
const isDark = useDark()
const { map } = useMap()

interface Props {
  locationsGeoJson: FeatureCollection<Geometry, Location>
  selectedLocationId: string | null
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

const layoutSymbolSpecification = {
  'icon-allow-overlap': true,
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

const locationsCircleLayerId = 'location-circle-layer'
const locationsSymbolLayerId = 'location-symbol-layer'
const locationsTextLayerId = 'location-text-layer'
const locationsSourceId = 'location-source'

watch(geojson, () => {
  addLocationIcons()
})

watch(
  () => props.selectedLocationId,
  () => {
    highlightSelectedLocationOnMap()
  },
)

onBeforeMount(() => {
  if (map) {
    for (const layerId of [locationsCircleLayerId, locationsSymbolLayerId]) {
      map.on('click', layerId, clickHandler)
      map.on('mouseenter', layerId, setCursorPointer)
      map.on('mouseleave', layerId, unsetCursorPointer)
    }
    map.on('sourcedata', sourceDateLoaded)
  }
  addLocationIcons()
})

onBeforeUnmount(() => {
  if (map) {
    for (const layerId of [locationsCircleLayerId, locationsSymbolLayerId]) {
      map.off('click', layerId, clickHandler)
      map.off('mouseenter', layerId, setCursorPointer)
      map.off('mouseleave', layerId, unsetCursorPointer)
    }
    map.off('sourcedata', sourceDateLoaded)
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
    const features = map.queryRenderedFeatures(event.point, {
      layers: [locationsSymbolLayerId, locationsCircleLayerId],
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

function sourceDateLoaded(e: MapSourceDataEvent) {
  if (e.sourceId === locationsSourceId && e.sourceDataType === 'metadata') {
    highlightSelectedLocationOnMap()
  }
}

function highlightSelectedLocationOnMap() {
  if (!map?.getSource(locationsSourceId)) return
  const locationId = props.selectedLocationId ?? 'noLayerSelected'

  // Move the selected location from the symbol layer to the circle layer, or vice versa
  map.setFilter(locationsSymbolLayerId, [
    'any',
    ['has', 'iconName'],
    ['==', 'locationId', locationId],
  ])
  map.setFilter(locationsCircleLayerId, [
    'all',
    ['!has', 'iconName'],
    ['!=', 'locationId', locationId],
  ])

  // Set the icon for the selected location
  map.setLayoutProperty(locationsSymbolLayerId, 'icon-image', [
    'match',
    ['get', 'locationId'],
    locationId,
    'selected-location', // icon for selected location
    ['get', 'iconName'], // default icon
  ])
  map.setLayoutProperty(locationsSymbolLayerId, 'icon-anchor', [
    'match',
    ['get', 'locationId'],
    locationId,
    'bottom', // The bottom of the map-marker, used for the selected location, should point to the location
    'center', // Default anchor for icons
  ])
  map.setLayoutProperty(locationsSymbolLayerId, 'icon-size', [
    'match',
    ['get', 'locationId'],
    locationId,
    0.1, // size of the map-marker, which is used for the selected location
    1, // default size
  ])
  map.setLayoutProperty(locationsSymbolLayerId, 'symbol-sort-key', [
    'match',
    ['get', 'locationId'],
    locationId,
    2, // sort key for selected location
    ['get', 'sortKey'], // default sort key
  ])
}

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('click', event)
}
</script>
