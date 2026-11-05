<template></template>

<script setup lang="ts">
import type {
  ExpressionSpecification,
  Source,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import { shouldBehaveLikeChildFilter } from '@/lib/map'
import { computed } from 'vue'
import { useLayer } from '@/services/useLayer'

interface Props {
  layerId: string
  sourceId: string
  source: Source | undefined
  isDark: boolean
  child?: boolean
  selectedLocationIds: string[]
  visibilityFilter: ExpressionSpecification
  showNames: boolean
}

const props = defineProps<Props>()

const filter = computed<SymbolLayerSpecification['filter']>(() => [
  'all',
  ['==', ['geometry-type'], 'Point'],
  [
    'any',
    ['!', ['has', 'iconName']],
    shouldBehaveLikeChildFilter(props.child, props.selectedLocationIds),
  ],
  props.visibilityFilter,
])

const layout = computed<SymbolLayerSpecification['layout']>(() => ({
  'text-field': props.showNames ? ['get', 'locationName'] : '',
  'text-size': 12,
  'text-overlap': 'never',
  'text-padding': 16,
  'text-justify': 'auto',
  'text-variable-anchor': ['right', 'left'],
  'text-max-width': 15,
  // When overlap is false sort order has to be inverted for some reason
  'symbol-sort-key': ['get', 'invertedSortKey'],
}))

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
    filter: filter.value,
    layout: layout.value,
    paint: paint.value,
    source: props.sourceId,
  }),
  () => props.source,
)
</script>
