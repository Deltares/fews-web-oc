<template></template>

<script setup lang="ts">
import type { LineLayerSpecification, Source } from 'maplibre-gl'
import { computed } from 'vue'
import { useLayer } from '@/services/useLayer'
import { getSubLayerId } from '@/lib/map'

interface Props {
  layerId: string
  sourceId: string
  source: Source | undefined
  isDark: boolean
}

const props = defineProps<Props>()

const filter: LineLayerSpecification['filter'] = ['==', '$type', 'Polygon']

const haloPaint = computed<LineLayerSpecification['paint']>(() => ({
  'line-color': props.isDark ? 'black' : 'white',
  'line-width': 6,
  'line-blur': 2,
  'line-opacity': [
    'case',
    ['boolean', ['feature-state', 'selected'], false],
    0.9,
    0,
  ],
}))

const paint = computed<LineLayerSpecification['paint']>(() => ({
  'line-color': props.isDark ? 'white' : 'black',
  'line-width': 0.5,
}))

useLayer(
  getSubLayerId(props.layerId, 'halo'),
  () => ({
    id: getSubLayerId(props.layerId, 'halo'),
    type: 'line',
    paint: haloPaint.value,
    filter,
    source: props.sourceId,
  }),
  () => props.source,
)

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
