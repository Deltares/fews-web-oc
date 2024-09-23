<template>
  <mgl-marker v-if="coordinate" v-model:coordinates="coordinate" draggable>
    <template #marker>
      <v-icon size="2rem" color="primary">mdi-map-marker</v-icon>
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
