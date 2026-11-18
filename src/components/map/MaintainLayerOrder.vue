<template></template>

<script setup lang="ts">
import { getLayerGroupId, isCustomLayer } from '@/lib/map'
import { useLayerOrder } from '@/services/useLayerOrder'
import { useMap } from '@/services/useMap'
import { watch } from 'vue'

const { map } = useMap()
const { layerOrder, getBeforeId } = useLayerOrder()

watch(layerOrder, (newOrder) => {
  if (!map) return

  // Reorder layers based on the new layer order
  // We reverse the order to ensure that layers are moved in the correct sequence
  newOrder.toReversed().forEach((layerId) => {
    if (!isCustomLayer(layerId)) return

    // A layer may consist of multiple map layers (e.g. an external overlay);
    // move all of them, keeping their relative order.
    const currentOrder = map.getLayersOrder()
    const groupLayerIds = currentOrder.filter(
      (id) => getLayerGroupId(id) === layerId,
    )
    if (groupLayerIds.length === 0) return

    const beforeId = getBeforeId(layerId, currentOrder)
    groupLayerIds.forEach((id) => map.moveLayer(id, beforeId))
  })
})
</script>
