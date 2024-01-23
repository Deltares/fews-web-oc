<template>
  <MapboxLayer id="selected-coordinate-layer" :options="defaultLayerOptions" />
</template>

<script setup lang="ts">
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import { Map, type CircleLayer, GeoJSONSource } from 'mapbox-gl'
import { Ref, watch } from 'vue'

interface Props {
  latitude?: number
  longitude?: number
}

const props = defineProps<Props>()

const { map } = useMap() as { map: Ref<Map> }

const emptyFeatureCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
  type: 'FeatureCollection',
  features: [],
}
const layerSourceId = 'selected-coordinate-layer'

watch(
  () => props.longitude,
  () => {
    const source = map.value.getSource(layerSourceId) as GeoJSONSource

    let data: Parameters<typeof source.setData>[0] = emptyFeatureCollection
    if (props.longitude && props.latitude) {
      const pointGeometry: Geometry = {
        type: 'Point',
        coordinates: [props.longitude, props.latitude],
      }
      data = {
        type: 'Feature',
        geometry: pointGeometry,
        properties: {},
      }
    }

    if (source) source.setData(data)
  },
)

const defaultLayerOptions: CircleLayer = {
  id: layerSourceId,
  type: 'circle',
  source: {
    type: 'geojson',
    data: emptyFeatureCollection,
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
