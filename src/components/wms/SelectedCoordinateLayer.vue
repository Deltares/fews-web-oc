<template>
  <mgl-geo-json-source :source-id="sourceId" :data="sourceData">
    <mgl-circle-layer :layer-id="layerId" :paint="paintSpecification" />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import { MglGeoJsonSource, MglCircleLayer, useMap } from 'vue-maplibre-gl'
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import { GeoJSONSource } from 'maplibre-gl'
import { watch, computed } from 'vue'

interface Props {
  latitude?: string
  longitude?: string
}

const props = defineProps<Props>()

const { map } = useMap()

const emptyFeatureCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
  type: 'FeatureCollection',
  features: [],
}
const layerSourceId = 'selected-coordinate-layer'

const layerId = 'current-location-layer'
const sourceId = 'current-location-source'

const sourceData = computed<
  | GeoJSON.Feature<GeoJSON.Geometry>
  | GeoJSON.FeatureCollection<GeoJSON.Geometry>
>(() => {
  if (props.latitude && props.longitude) {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [+props.longitude, +props.latitude],
      },
      properties: {},
    }
  }

  return emptyFeatureCollection
})

watch(sourceData, () => {
  if (map) {
    const source = map.getSource(layerSourceId) as GeoJSONSource
    if (source) source.setData(sourceData.value)
  }
})

const paintSpecification = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-opacity': 0.75,
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1.5,
}
</script>
