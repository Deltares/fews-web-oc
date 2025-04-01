<template>
  <mgl-symbol-layer :layerId="layerId" :layout="layout" :filter="filter" />
</template>

<script setup lang="ts">
import { MglSymbolLayer } from '@indoorequal/vue-maplibre-gl'

interface Props {
  layerId: string
}

defineProps<Props>()

const layout = {
  'icon-allow-overlap': true,
  'icon-image': ['get', 'iconName'],
  'symbol-sort-key': ['get', 'sortKey'],
}

const filter = ['all', ['has', 'iconName'], ['==', '$type', 'Point']]
</script>
