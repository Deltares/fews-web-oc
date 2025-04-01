<template>
  <mgl-symbol-layer
    :layerId="layerId"
    :layout="layout"
    :paint="paint"
    :filter="filter"
  />
</template>

<script setup lang="ts">
import { MglSymbolLayer } from '@indoorequal/vue-maplibre-gl'
import { computed } from 'vue'

interface Props {
  layerId: string
  isDark: boolean
}

const props = defineProps<Props>()

const filter = ['==', '$type', 'Point']

const layout = {
  'text-field': ['get', 'locationName'],
  'text-size': 12,
  'text-overlap': 'never',
  'text-padding': 10,
  'text-justify': 'auto',
  'text-variable-anchor': ['right', 'left'],
  'text-max-width': 15,
  // When overlap is false sort order has to be inverted for some reason:
  // https://maplibre.org/maplibre-style-spec/layers/#symbol-sort-key
  'symbol-sort-key': ['+', 999, ['-', ['get', 'sortKey']]],
}

const paint = computed(() => {
  return {
    'text-color': props.isDark ? 'rgb(255,255,255)' : 'rgb(0,0,0)',
    'text-halo-color': props.isDark ? 'rgb(0,0,0)' : 'rgb(255,255,255)',
    'text-halo-width': 1,
    'text-halo-blur': 1,
  }
})
</script>
