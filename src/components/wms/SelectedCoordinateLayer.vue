<template>
  <mgl-geo-json-source :source-id="sourceId" :data="props.geoJson">
    <mgl-circle-layer :layer-id="layerId" :paint="paintSpecification" />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import { MglGeoJsonSource, MglCircleLayer } from 'vue-maplibre-gl'

interface Props {
  geoJson?:
    | GeoJSON.Feature<GeoJSON.Geometry>
    | GeoJSON.FeatureCollection<GeoJSON.Geometry>
}

const props = withDefaults(defineProps<Props>(), {
  geoJson: () => ({
    type: 'FeatureCollection',
    features: [],
  }),
})

const layerId = 'selected-coordinate-layer'
const sourceId = 'selected-coordinate-source'

const paintSpecification = {
  'circle-radius': 8,
  'circle-color': 'blue',
  'circle-stroke-color': 'white',
  'circle-stroke-width': 2.5,
}
</script>
