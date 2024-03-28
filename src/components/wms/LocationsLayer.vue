<template>
  <mgl-geo-json-source
    :source-id="locationsSourceId"
    :data="props.locationsGeoJson"
  >
    <mgl-symbol-layer
      :layer-id="locationsLayerId"
      :layout="layoutSpecification"
      :paint="paintSpecification"
    />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import { MglSymbolLayer, MglGeoJsonSource, useMap } from 'vue-maplibre-gl'
import { FeatureCollection, Geometry } from 'geojson'
import { type Location } from '@deltares/fews-pi-requests'
import {
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  MapSourceDataEvent,
} from 'maplibre-gl'
import { watch, onBeforeUnmount } from 'vue'
import { onBeforeMount } from 'vue'
import { uniqBy } from 'lodash'
import { getResourcesIconsUrl } from '@/lib/fews-config'

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

const emit = defineEmits(['click'])

const layoutSpecification = {
  'icon-allow-overlap': true,
  'symbol-sort-key': 1,
}

const paintSpecification = {
  'icon-opacity': 0.75,
}

const { map } = useMap()

const locationsLayerId = 'location-layer'
const locationsSourceId = 'location-source'

watch(
  () => props.locationsGeoJson,
  () => {
    addLocationIcons()
  },
)

function addLocationIcons() {
  const locationIcons = uniqBy(
    props.locationsGeoJson.features,
    'properties.iconName',
  ).map((feature) => feature.properties.iconName ?? '')
  if (map) {
    // Default icon for selected location
    map.loadImage('/images/map-marker.png', function (error, image) {
      if (error) throw error
      if (!map.hasImage('map-marker') && image !== undefined && image !== null)
        map.addImage('map-marker', image)
    })
    // Specific icons for locations
    for (const iconName of locationIcons) {
      map.loadImage(getResourcesIconsUrl(iconName), function (error, image) {
        if (error) throw error
        if (!map.hasImage(iconName) && image !== undefined && image !== null)
          map.addImage(iconName, image)
      })
    }
  }
}

function clickHandler(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (map) {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [locationsLayerId],
    })
    if (!features.length) return
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

onBeforeMount(() => {
  if (map) {
    map.on('click', locationsLayerId, clickHandler)
    map.on('mouseenter', locationsLayerId, setCursorPointer)
    map.on('mouseleave', locationsLayerId, unsetCursorPointer)
    map.on('sourcedata', sourceDateLoaded)
  }
  addLocationIcons()
})

onBeforeUnmount(() => {
  if (map) {
    map.off('click', locationsLayerId, clickHandler)
    map.off('mouseenter', locationsLayerId, setCursorPointer)
    map.off('mouseleave', locationsLayerId, unsetCursorPointer)
    map.off('sourcedata', sourceDateLoaded)
  }
})

watch(
  () => props.selectedLocationId,
  () => {
    highlightSelectedLocationOnMap()
  },
)

function highlightSelectedLocationOnMap() {
  if (!map?.getSource(locationsSourceId)) return
  const locationId = props.selectedLocationId ?? 'noLayerSelected'
  map.setLayoutProperty(locationsLayerId, 'icon-image', [
    'match',
    ['get', 'locationId'],
    locationId,
    'map-marker', // icon for selected location
    ['get', 'iconName'], // default icon
  ])
  map.setLayoutProperty(locationsLayerId, 'icon-anchor', [
    'match',
    ['get', 'locationId'],
    locationId,
    'bottom', // The bottom of the map-marker, used for the selected location, should point to the location
    'center', // Default anchor for icons
  ])
  map.setLayoutProperty(locationsLayerId, 'icon-size', [
    'match',
    ['get', 'locationId'],
    locationId,
    0.1, // size of the map-marker, which is used for the selected location
    1, // default size
  ])
  map.setLayoutProperty(locationsLayerId, 'symbol-sort-key', [
    'match',
    ['get', 'locationId'],
    locationId,
    2, // sort key for selected location
    1, // default sort key
  ])
}

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('click', event)
}
</script>
