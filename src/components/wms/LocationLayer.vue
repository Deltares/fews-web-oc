<template>
  <div>
    <MapboxLayer
      v-if="showLocationsLayer"
      id="location-layer"
      :source="locationLayerSource"
      :options="locationsLayerOptions"
      clickable
    />
    <v-chip
      class="chip"
      :style="{ backgroundColor: backgroundColor }"
      pill
      label
    >
      <v-icon>mdi-map-marker</v-icon>
      <v-switch
        class="ml-2 mt-5"
        color="primary"
        :model-value="showLocationsLayer"
        @update:model-value="onShowLocationsLayerChange"
      />
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { Ref, ref, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import { fetchLocationsAsGeoJson } from '@/lib/topology'
import { Location } from '@deltares/fews-pi-requests'
import { MapboxLayer, useMap } from '@studiometa/vue-mapbox-gl'
import { Map, GeoJSONSource } from 'mapbox-gl'

import useLocationsLayer from '@/services/useLocationsLayer'

interface Props {
  filterIds: string[]
}
const props = withDefaults(defineProps<Props>(), {
  filterIds: () => {
    return []
  },
})
const backgroundColor = ref<string>(
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'rgba(0,0,0,.5)'
    : 'rgba(255,255,255,.5)',
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { map } = useMap() as { map: Ref<Map> }

const locationsGeoJson = ref<
  GeoJSON.FeatureCollection<GeoJSON.Geometry, Location>
>({
  type: 'FeatureCollection',
  features: [],
})
const showLocationsLayer = ref<boolean>(true)
const { locationsLayerOptions } = useLocationsLayer(locationsGeoJson)

const locationLayerSource = 'location-layer'

watchEffect(async () => {
  if (!props.filterIds) return
  locationsGeoJson.value = await fetchLocationsAsGeoJson(
    baseUrl,
    props.filterIds,
  )
  const source = map.value.getSource(locationLayerSource) as GeoJSONSource
  if (source) {
    source.setData(locationsGeoJson.value)
  }
})

function onShowLocationsLayerChange(): void {
  showLocationsLayer.value = !showLocationsLayer.value
}
</script>

<style scoped>
.chip {
  backdrop-filter: blur(4px);
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  top: 10px;
  left: 10px;
}
</style>
