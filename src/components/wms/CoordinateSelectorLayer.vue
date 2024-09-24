<template>
  <mgl-marker
    v-if="coordinate"
    v-model:coordinates="coordinate"
    draggable
    :offset="[0, 4]"
    anchor="bottom"
  >
    <template #marker>
      <v-icon size="32px" color="primary">mdi-map-marker</v-icon>
    </template>
  </mgl-marker>
</template>

<script setup lang="ts">
import { MglMarker } from '@indoorequal/vue-maplibre-gl'
import type { LngLat } from 'maplibre-gl'

const coordinate = defineModel<LngLat | null>('coordinate', {
  default: null,
})
</script>
