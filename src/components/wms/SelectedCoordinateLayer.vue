<template>
  <MapboxLayer id="selected-coordinate-layer" :options="defaultLayerOptions" />
</template>

<script setup lang="ts">
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import { Map, type CircleLayer, GeoJSONSource } from 'mapbox-gl'
import { Ref, watch, computed } from 'vue'

interface Props {
  latitude?: string
  longitude?: string
}

const props = defineProps<Props>()

const { map } = useMap() as { map: Ref<Map> }

const emptyFeatureCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
  type: 'FeatureCollection',
  features: [],
}
const layerSourceId = 'selected-coordinate-layer'

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
  const source = map.value.getSource(layerSourceId) as GeoJSONSource
  if (source) source.setData(sourceData.value)
})

const defaultLayerOptions: CircleLayer = {
  id: layerSourceId,
  type: 'circle',
  source: {
    type: 'geojson',
    data: sourceData.value,
  },
  layout: {
    visibility: 'visible',
  },
  paint: {
    'circle-radius': 8,
    'circle-color': 'blue',
    'circle-stroke-color': 'white',
    'circle-stroke-width': 2.5,
  },
}
</script>
