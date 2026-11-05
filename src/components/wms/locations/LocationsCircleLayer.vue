<template></template>

<script setup lang="ts">
import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  Source,
} from 'maplibre-gl'
import { computed } from 'vue'
import { useLayer } from '@/services/useLayer'

interface Props {
  layerId: string
  sourceId: string
  source: Source | undefined
  visibilityFilter: ExpressionSpecification
}

const props = defineProps<Props>()

const paint: CircleLayerSpecification['paint'] = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1.5,
}

const filter = computed<CircleLayerSpecification['filter']>(() => [
  'all',
  ['!', ['has', 'iconName']],
  ['==', ['geometry-type'], 'Point'],
  props.visibilityFilter,
])

useLayer(
  props.layerId,
  () => ({
    id: props.layerId,
    type: 'circle',
    paint,
    filter: filter.value,
    source: props.sourceId,
  }),
  () => props.source,
)
</script>
