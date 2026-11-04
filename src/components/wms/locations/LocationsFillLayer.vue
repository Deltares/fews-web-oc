<template></template>

<script setup lang="ts">
import type { FillLayerSpecification, Source } from 'maplibre-gl'
import { computed, onScopeDispose, watch } from 'vue'
import { useLayer } from '@/services/useLayer'
import { useMap } from '@/services/useMap'

interface Props {
  layerId: string
  sourceId: string
  source: Source | undefined
  selectedLocationIds: string[] | undefined
  isDark: boolean
  hoveredStateId: string | undefined
}

const props = defineProps<Props>()
const { map } = useMap()

const filter: FillLayerSpecification['filter'] = ['==', '$type', 'Polygon']

const paint = computed<FillLayerSpecification['paint']>(() => ({
  'fill-color': props.isDark ? 'darkgrey' : '#dfdfdf',
  'fill-opacity': [
    'case',
    ['boolean', ['feature-state', 'selected'], false],
    props.isDark ? 0.35 : 0.8,
    ['boolean', ['feature-state', 'hover'], false],
    props.isDark ? 0.3 : 0.6,
    props.isDark ? 0.2 : 0.3,
  ],
  'fill-outline-color': props.isDark ? 'white' : 'black',
}))

useLayer(
  props.layerId,
  () => ({
    id: props.layerId,
    type: 'fill',
    paint: paint.value,
    filter: filter,
    source: props.sourceId,
  }),
  () => props.source,
)

let selectedIds = new Set<string>()
watch(
  [() => props.source, () => props.selectedLocationIds?.slice()],
  ([source, ids], [previousSource]) => {
    if (source !== previousSource) selectedIds = new Set()
    if (!map || !source) return

    const nextIds = new Set(ids)
    for (const id of selectedIds) {
      if (!nextIds.has(id)) {
        map.removeFeatureState({ source: props.sourceId, id }, 'selected')
      }
    }
    for (const id of nextIds) {
      if (!selectedIds.has(id)) {
        map.setFeatureState({ source: props.sourceId, id }, { selected: true })
      }
    }
    selectedIds = nextIds
  },
  { immediate: true },
)

watch(
  [() => props.source, () => props.hoveredStateId],
  ([source, id], [previousSource, previousId]) => {
    if (!map || !source) return
    if (source === previousSource && previousId !== undefined) {
      map.removeFeatureState(
        { source: props.sourceId, id: previousId },
        'hover',
      )
    }
    if (id !== undefined) {
      map.setFeatureState({ source: props.sourceId, id }, { hover: true })
    }
  },
  { immediate: true },
)

onScopeDispose(() => {
  if (!map || !props.source || map.getSource(props.sourceId) !== props.source) {
    return
  }
  for (const id of selectedIds) {
    map.removeFeatureState({ source: props.sourceId, id }, 'selected')
  }
  if (props.hoveredStateId !== undefined) {
    map.removeFeatureState(
      { source: props.sourceId, id: props.hoveredStateId },
      'hover',
    )
  }
})
</script>
