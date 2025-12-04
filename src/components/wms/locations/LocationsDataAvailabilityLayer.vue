<template>
  <mgl-symbol-layer
    :layerId="layerId"
    :layout="layout"
    :filter="filter"
    :paint="paint"
  />
</template>

<script setup lang="ts">
import { MglSymbolLayer } from '@indoorequal/vue-maplibre-gl'
import { SymbolLayerSpecification } from 'maplibre-gl'

interface Props {
  layerId: string
}
defineProps<Props>()

// Only show overlay icons for locations with no data available in the view
// period.
const filter: SymbolLayerSpecification['filter'] = [
  '!',
  ['get', 'hasDataInViewPeriod'],
]

const layout: SymbolLayerSpecification['layout'] = {
  'icon-image': 'mdi:overlay-remove',
  'icon-overlap': 'always',
  'icon-size': 1.2,
}

const paint: SymbolLayerSpecification['paint'] = {
  'icon-color': [
    'case',
    ['get', 'hasDataOutsideViewPeriod'],
    '#770000',
    '#cc0000',
  ],
}
</script>
