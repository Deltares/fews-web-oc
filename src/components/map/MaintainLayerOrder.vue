<template></template>

<script setup lang="ts">
import { isCustomLayer } from '@/lib/map'
import { useLayerOrder } from '@/services/useLayerOrder'
import { useMap } from '@/services/useMap'
import { watch } from 'vue'

const { map } = useMap()
const { layerOrder, getBeforeId } = useLayerOrder()

watch(
  layerOrder,
  (newOrder) => {
    if (!map) return

    // Reorder layers based on the new layer order
    // We reverse the order to ensure that layers are moved in the correct sequence
    newOrder.toReversed().forEach((layerId) => {
      if (!isCustomLayer(layerId)) return
      if (!map.getLayer(layerId)) return

      const beforeId = getBeforeId(layerId, map.getLayersOrder())
      map.moveLayer(layerId, beforeId)
    })
  },
  { deep: true },
)
</script>
