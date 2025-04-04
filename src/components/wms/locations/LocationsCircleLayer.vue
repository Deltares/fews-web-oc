<template>
  <mgl-circle-layer :layerId="layerId" :paint="paint" :filter="filter" />
</template>

<script setup lang="ts">
import { MglCircleLayer } from '@indoorequal/vue-maplibre-gl'

interface Props {
  layerId: string
}

defineProps<Props>()

const paint = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1.5,
}

const filter = ['all', ['!has', 'iconName'], ['==', '$type', 'Point']]
</script>
