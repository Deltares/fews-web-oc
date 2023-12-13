<template>
  <div>
    <MapboxLayer
      :id="`location-layer-${props.layerName}`"
      :source="locationLayerSource"
      :options="locationsLayerOptions"
      clickable
    />
  </div>
</template>

<script setup lang="ts">
import { Ref, ref, watchEffect, computed } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchLocationsAsGeoJson } from '@/lib/topology'
import { Location } from '@deltares/fews-pi-requests'
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import { Map, GeoJSONSource } from 'mapbox-gl'

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
const { map } = useMap() as { map: Ref<Map> }

const locationsGeoJson = ref<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, Location>
>({
  type: 'FeatureCollection',
  features: [],
})

const { locationsLayerOptions } = useLocationsLayer(locationsGeoJson)

const locationLayerSource = computed(() => `location-layer-${props.selectedLayer}`)

watchEffect(async () => {
  if (!props.filterIds) return
  locationsGeoJson.value = await fetchLocationsAsGeoJson(
    baseUrl,
    props.filterIds,
  )
  const source = map.value.getSource(locationLayerSource.value) as GeoJSONSource
  if (source) {
    source.setData(locationsGeoJson.value)
  }
})
</script>
