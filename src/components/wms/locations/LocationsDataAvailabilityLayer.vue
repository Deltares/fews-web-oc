<template>
  <!-- @vue-ignore -->
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
import { computed } from 'vue'

interface Props {
  layerId: string
  show: boolean
}
const props = defineProps<Props>()

const filter = computed<SymbolLayerSpecification['filter']>(() => {
  if (props.show) {
    return ['!', ['get', 'hasDataInViewPeriod']]
  } else {
    return ['==', '1', '0'] // Always false filter
  }
})

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
