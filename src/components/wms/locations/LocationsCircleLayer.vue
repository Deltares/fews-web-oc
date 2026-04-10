<template></template>

<script setup lang="ts">
import type { CircleLayerSpecification, Source } from 'maplibre-gl'
import { useLayer } from '@/services/useLayer'

interface Props {
  layerId: string
  sourceId: string
  source: Source | undefined
}

const props = defineProps<Props>()

const paint: CircleLayerSpecification['paint'] = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1.5,
}

const filter: CircleLayerSpecification['filter'] = [
  'all',
  ['!has', 'iconName'],
  ['==', '$type', 'Point'],
]

useLayer(
  props.layerId,
  {
    id: props.layerId,
    type: 'circle',
    paint,
    filter,
    source: props.sourceId,
  },
  () => props.source,
)
</script>
