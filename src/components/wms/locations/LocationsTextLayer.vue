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
  child?: boolean
}

const props = defineProps<Props>()

const filter = [
  'all',
  ['==', '$type', 'Point'],
  props.child
    ? // Child: has parentLocationId AND not selected
      ['all', ['has', 'parentLocationId'], ['!=', 'selected', true]]
    : // Parent: no parentLocationId OR selected
      ['any', ['!has', 'parentLocationId'], ['==', 'selected', true]],
]

const layout = {
  'text-field': ['get', 'locationName'],
  'text-size': 12,
  'text-overlap': 'never',
  'text-padding': 10,
  'text-justify': 'auto',
  'text-variable-anchor': ['right', 'left'],
  'text-max-width': 15,
  // When overlap is false sort order has to be inverted for some reason
  'symbol-sort-key': ['get', 'invertedSortKey'],
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
