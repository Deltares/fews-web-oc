<template></template>

<script setup lang="ts">
import type { LineLayerSpecification, Source } from 'maplibre-gl'
import { computed } from 'vue'
import { useLayer } from '@/services/useLayer'

interface Props {
  layerId: string
  sourceId: string
  source: Source | undefined
  isDark: boolean
}

const props = defineProps<Props>()

const filter: LineLayerSpecification['filter'] = ['==', '$type', 'Polygon']

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
    filter: filter,
    source: props.sourceId,
  }),
  () => props.source,
)
</script>
