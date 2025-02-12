<template>
  <mgl-geo-json-source v-if="geojson" :sourceId :data="geojson">
    <mgl-fill-layer
      v-if="overlay.type === 'fill'"
      :paint="overlay.paint"
      :layerId
    />
    <mgl-line-layer
      v-if="overlay.type === 'line'"
      :paint="overlay.paint"
      :layerId
    />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import {
  MglGeoJsonSource,
  MglFillLayer,
  MglLineLayer,
} from '@indoorequal/vue-maplibre-gl'
import { fetchLocationSetAsGeoJson } from '@/lib/topology/locations'
import { configManager } from '@/services/application-config'
import { asyncComputed } from '@vueuse/core'
import { getLayerId, getSourceId } from '@/lib/map'
import { Overlay } from '@deltares/fews-pi-requests'

interface Props {
  overlay: Overlay
}

const props = defineProps<Props>()

const sourceId = getSourceId(`overlay-${props.overlay.id}`)
const layerId = getLayerId(`overlay-${props.overlay.id}`)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const geojson = asyncComputed(async () =>
  props.overlay.locationSetId
    ? await fetchLocationSetAsGeoJson(baseUrl, props.overlay.locationSetId)
    : undefined,
)
</script>
