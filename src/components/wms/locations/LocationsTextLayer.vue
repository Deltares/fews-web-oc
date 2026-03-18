<template></template>

<script setup lang="ts">
import type { Source, SymbolLayerSpecification } from 'maplibre-gl'
import { locationMapIds, shouldBehaveLikeChildFilter } from '@/lib/map'
import { computed } from 'vue'
import { useLayer } from '@/services/useLayer'

interface Props {
  layerId: string
  source: Source | undefined
  isDark: boolean
  child?: boolean
}

const props = defineProps<Props>()

const filter: SymbolLayerSpecification['filter'] = [
  'all',
  ['==', '$type', 'Point'],
  ['any', ['!has', 'iconName'], shouldBehaveLikeChildFilter(props.child)],
]

const layout: SymbolLayerSpecification['layout'] = {
  'text-field': ['get', 'locationName'],
  'text-size': 12,
  'text-overlap': 'never',
  'text-padding': 16,
  'text-justify': 'auto',
  'text-variable-anchor': ['right', 'left'],
  'text-max-width': 15,
  // When overlap is false sort order has to be inverted for some reason
  'symbol-sort-key': ['get', 'invertedSortKey'],
}

const paint = computed<SymbolLayerSpecification['paint']>(() => {
  return {
    'text-color': props.isDark ? 'rgb(255,255,255)' : 'rgb(0,0,0)',
    'text-halo-color': props.isDark ? 'rgb(0,0,0)' : 'rgb(255,255,255)',
    'text-halo-width': 1,
    'text-halo-blur': 1,
  }
})

useLayer(
  props.layerId,
  () => ({
    id: props.layerId,
    type: 'symbol',
    filter,
    layout,
    paint: paint.value,
    source: locationMapIds.source,
  }),
  [],
  () => props.source,
)
</script>
