<template>
  <div>
    <MapboxLayer
      :id="`location-layer-${props.layerName}`"
      :source="`location-layer-${props.selectedLayer}`"
      :options="locationsLayerOptions"
      clickable
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchLocationsAsGeoJson } from '@/lib/topology'
import { Location } from '@deltares/fews-pi-requests'
import { MapboxLayer } from '@studiometa/vue-mapbox-gl'

import useLocationsLayer from '@/services/useLocationsLayer'

interface Props {
  layerName: string
  selectedLayer: string
  filterIds: string[]
}
const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  selectedLayer: '',
  filterIds: () => {
    return []
  },
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const locationsGeoJson = ref<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, Location>
>({
  type: 'FeatureCollection',
  features: [],
})

const { locationsLayerOptions } = useLocationsLayer(locationsGeoJson)

watchEffect(async () => {
  if (!props.filterIds) return
  locationsGeoJson.value = await fetchLocationsAsGeoJson(
    baseUrl,
    props.filterIds,
  )
})
</script>
