<template>
  <mgl-fill-layer :layerId="layerId" :paint="paint" :filter="filter" />
</template>

<script setup lang="ts">
import type { FillLayerSpecification } from 'maplibre-gl'
import { MglFillLayer } from '@indoorequal/vue-maplibre-gl'
import { computed } from 'vue'

interface Props {
  layerId: string
  selectedLocationIds: string[] | undefined
  isDark: boolean
  hoveredStateId: string | undefined
}

const props = defineProps<Props>()

const filter: FillLayerSpecification['filter'] = ['==', '$type', 'Polygon']

const paint = computed(() => {
  const selectedIds = props.selectedLocationIds?.length
    ? props.selectedLocationIds
    : ['invalid-no-layer-selected']
  const hoverStateId = props.hoveredStateId ?? 'invalid-no-hover'
  const hoverId = selectedIds.includes(hoverStateId)
    ? 'invalid-already-selected'
    : hoverStateId
  return props.isDark
    ? getDarkPaint(selectedIds, hoverId)
    : getLightPaint(selectedIds, hoverId)
})

function getDarkPaint(
  selectedIds: string[],
  hoverId: string,
): FillLayerSpecification['paint'] {
  return {
    'fill-color': 'darkgrey',
    'fill-opacity': [
      'match',
      ['get', 'locationId'],
      selectedIds,
      0.35,
      hoverId,
      0.3,
      0.2,
    ],
    'fill-outline-color': 'white',
  }
}

function getLightPaint(
  selectedIds: string[],
  hoverId: string,
): FillLayerSpecification['paint'] {
  return {
    'fill-color': '#dfdfdf',
    'fill-opacity': [
      'match',
      ['get', 'locationId'],
      selectedIds,
      0.8,
      hoverId,
      0.6,
      0.3,
    ],
    'fill-outline-color': 'black',
  }
}
</script>
