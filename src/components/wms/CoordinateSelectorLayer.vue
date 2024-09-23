<template>
  <mgl-marker v-if="coordinate" v-model:coordinates="coordinate" draggable />
</template>

<script setup lang="ts">
import { MglMarker } from '@indoorequal/vue-maplibre-gl'
import type { LngLat } from 'maplibre-gl'

const coordinate = defineModel<LngLat | null>('coordinate', {
  default: null,
})
</script>
