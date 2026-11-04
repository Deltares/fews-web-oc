<template></template>

<script setup lang="ts">
import type { FillLayerSpecification, Source } from 'maplibre-gl'
import { computed, onScopeDispose, watch } from 'vue'
import { isStyleReady } from '@/lib/map'
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

const appliedSelectedIds = new Set<string>()
let appliedHoveredId: string | undefined

function syncFeatureState() {
  if (!map || !props.source || !isStyleReady(map)) return

  const selectedIds = new Set(props.selectedLocationIds)
  for (const id of appliedSelectedIds) {
    if (!selectedIds.has(id)) {
      map.removeFeatureState({ source: props.sourceId, id }, 'selected')
      appliedSelectedIds.delete(id)
    }
  }
  for (const id of selectedIds) {
    if (!appliedSelectedIds.has(id)) {
      map.setFeatureState({ source: props.sourceId, id }, { selected: true })
      appliedSelectedIds.add(id)
    }
  }

  if (props.hoveredStateId !== appliedHoveredId) {
    if (appliedHoveredId !== undefined) {
      map.removeFeatureState(
        { source: props.sourceId, id: appliedHoveredId },
        'hover',
      )
    }
    if (props.hoveredStateId !== undefined) {
      map.setFeatureState(
        { source: props.sourceId, id: props.hoveredStateId },
        { hover: true },
      )
    }
    appliedHoveredId = props.hoveredStateId
  }
}

// Feature state belongs to the source instance, so it has to be applied again
// when the source is recreated or the style is rebuilt. A rebuild keeps the
// source ref unchanged, which is why it needs the style.load event.
function restoreFeatureState() {
  appliedSelectedIds.clear()
  appliedHoveredId = undefined
  syncFeatureState()
}

watch(
  [() => props.selectedLocationIds?.slice(), () => props.hoveredStateId],
  syncFeatureState,
  { immediate: true },
)
watch(() => props.source, restoreFeatureState)
map?.on('style.load', restoreFeatureState)

onScopeDispose(() => {
  map?.off('style.load', restoreFeatureState)
  if (!map || !isStyleReady(map) || !map.getSource(props.sourceId)) return

  for (const id of appliedSelectedIds) {
    map.removeFeatureState({ source: props.sourceId, id }, 'selected')
  }
  if (appliedHoveredId !== undefined) {
    map.removeFeatureState(
      { source: props.sourceId, id: appliedHoveredId },
      'hover',
    )
  }
})
</script>
