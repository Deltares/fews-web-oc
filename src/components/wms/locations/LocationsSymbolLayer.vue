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
import { computed } from 'vue'

interface Props {
  layerId: string
  isDark: boolean
  child?: boolean
}

const props = defineProps<Props>()

const filter = [
  'all',
  ['has', 'iconName'],
  ['==', '$type', 'Point'],
  props.child
    ? // Child: has parentLocationId AND not selected
      ['all', ['has', 'parentLocationId'], ['!=', 'selected', true]]
    : // Parent: no parentLocationId OR selected
      ['any', ['!has', 'parentLocationId'], ['==', 'selected', true]],
]

const baseLayout = {
  'icon-image': ['get', 'iconName'],
  'symbol-sort-key': ['get', 'sortKey'],
}

// This symbol layer is for the child locations and can't overlap other symbols.
// It also contains its own text since we never want to show the text of the
// child layer without the icon.
const childLayout = {
  ...baseLayout,
  'icon-overlap': 'never',
  'text-optional': true,
  'text-field': ['get', 'locationName'],
  'text-size': 12,
  'text-overlap': 'never',
  'text-justify': 'auto',
  'text-anchor': 'right',
  'text-max-width': 15,
}

const parentLayout = {
  ...baseLayout,
  'icon-overlap': 'always',
}

const layout = computed(() => {
  return props.child ? childLayout : parentLayout
})

const paint = computed(() => {
  return {
    'text-color': props.isDark ? 'rgb(255,255,255)' : 'rgb(0,0,0)',
    'text-halo-color': props.isDark ? 'rgb(0,0,0)' : 'rgb(255,255,255)',
    'text-halo-width': 1,
    'text-halo-blur': 1,
    'text-translate': [-10, 0],
  }
})
</script>
