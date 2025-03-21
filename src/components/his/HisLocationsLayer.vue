<template>
  <mgl-geo-json-source :source-id="hisLocationsSourceId" :data="geojson">
    <mgl-circle-layer
      :layer-id="hisLocationsLayerId"
      :paint="paintSpecification"
      :layout="layoutSpecification"
      @click="onLocationClick"
    />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import { MglCircleLayer, MglGeoJsonSource } from '@indoorequal/vue-maplibre-gl'
import { computed } from 'vue'
import type { FeatureCollection, Geometry } from 'geojson'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import { getLayerId, getSourceId } from '@/lib/map'

interface Props {
  geojson?: FeatureCollection<Geometry, Location>
}

withDefaults(defineProps<Props>(), {
  geojson: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
})

const selectedLocationId = defineModel<string | null>(
  'selectedLocationId',
  {
    required: true,
  },
)

const hisLocationsSourceId = getSourceId('his-locations-source')
const hisLocationsLayerId = getLayerId('his-locations-layer')

const isCurrentLocation = computed(() => [
  '==',
  ['get', 'id'],
  ['to-string', selectedLocationId.value],
])

const paintSpecification: (typeof MglCircleLayer)['paint'] = computed(() => ({
  'circle-color': [
    'case',
    isCurrentLocation.value,
    'rgb(255, 238, 0)',
    'rgb(0, 158, 227)',
  ],
  'circle-radius': 5,
  'circle-stroke-width': 1,
  'circle-stroke-color': '#fff',
}))

const layoutSpecification: (typeof MglCircleLayer)['layout'] = computed(() => ({
  'circle-sort-key': ['case', isCurrentLocation.value, 1000, 0],
}))

function onLocationClick(event: MapLayerMouseEvent) {
  const feature = event.features?.[0]
  if (!feature) return

  selectedLocationId.value = feature.properties?.locationId
}
</script>
