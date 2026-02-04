<template>
  <mgl-symbol-layer
    :layerId="layerId"
    :layout="layout as any"
    :filter="filter"
    :paint="paint"
  />
</template>

<script setup lang="ts">
import type { SymbolLayerSpecification } from 'maplibre-gl'
import { shouldBehaveLikeChildFilter } from '@/lib/map'
import { MglSymbolLayer } from '@indoorequal/vue-maplibre-gl'
import { computed } from 'vue'

interface Props {
  layerId: string
  isDark: boolean
  child?: boolean
}

const props = defineProps<Props>()

const filter: SymbolLayerSpecification['filter'] = [
  'all',
  ['has', 'iconName'],
  ['==', '$type', 'Point'],
  shouldBehaveLikeChildFilter(props.child),
]

const baseLayout: SymbolLayerSpecification['layout'] = {
  'icon-image': ['get', 'iconName'],
  'symbol-sort-key': ['get', 'sortKey'],
}

// This symbol layer is for the child locations and can't overlap other symbols.
// It also contains its own text since we never want to show the text of the
// child layer without the icon.
const childLayout: SymbolLayerSpecification['layout'] = {
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

const parentLayout: SymbolLayerSpecification['layout'] = {
  ...baseLayout,
  'icon-overlap': 'always',
}

// const layout = computed<SymbolLayerSpecification['layout']>(() => {
const layout = computed<any>(() => {
  return props.child ? childLayout : parentLayout
})

const paint = computed<SymbolLayerSpecification['paint']>(() => {
  return {
    'text-color': props.isDark ? 'rgb(255,255,255)' : 'rgb(0,0,0)',
    'text-halo-color': props.isDark ? 'rgb(0,0,0)' : 'rgb(255,255,255)',
    'text-halo-width': 1,
    'text-halo-blur': 1,
    'text-translate': [-10, 0],
  }
})
</script>
