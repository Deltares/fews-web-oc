<template>
  <mgl-circle-layer :layerId="layerId" :paint="paint" :filter="filter" />
</template>

<script setup lang="ts">
import type { CircleLayerSpecification } from 'maplibre-gl'
import { MglCircleLayer } from '@indoorequal/vue-maplibre-gl'

interface Props {
  layerId: string
}

defineProps<Props>()

const paint: CircleLayerSpecification['paint'] = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1.5,
}

const filter: CircleLayerSpecification['filter'] = [
  'all',
  ['!has', 'iconName'],
  ['==', '$type', 'Point'],
]
</script>
