<template></template>

<script setup lang="ts">
import type {
  ExpressionSpecification,
  LineLayerSpecification,
  Source,
} from 'maplibre-gl'
import { computed } from 'vue'
import { useLayer } from '@/services/useLayer'

interface Props {
  layerId: string
  sourceId: string
  source: Source | undefined
  isDark: boolean
  visibilityFilter: ExpressionSpecification
}

const props = defineProps<Props>()

const filter = computed<LineLayerSpecification['filter']>(() => [
  'all',
  ['==', ['geometry-type'], 'Polygon'],
  props.visibilityFilter,
])

const paint = computed<LineLayerSpecification['paint']>(() => ({
  'line-color': props.isDark ? 'white' : 'black',
  'line-width': 0.5,
}))

useLayer(
  props.layerId,
  () => ({
    id: props.layerId,
    type: 'line',
    paint: paint.value,
    filter: filter.value,
    source: props.sourceId,
  }),
  () => props.source,
)
</script>
