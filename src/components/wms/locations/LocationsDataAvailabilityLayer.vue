<template>
  <mgl-symbol-layer :layerId="layerId" :layout="layout" :filter="filter" />
</template>

<script setup lang="ts">
import { MglSymbolLayer } from '@indoorequal/vue-maplibre-gl'

interface Props {
  layerId: string
}
defineProps<Props>()

// Only show overlay icons for locations with no data available in the view
// period.
const filter = ['!', ['get', 'hasDataInViewPeriod']]

const layout = {
  // Show a different icon when there is data available outside the view period
  // and when there is no data available whatsoever.
  'icon-image': [
    'case',
    ['get', 'hasDataOutsideViewPeriod'],
    'no-data-in-view-period',
    'no-data',
  ],
  'icon-overlap': 'always',
  'icon-size': 0.25,
}
</script>
