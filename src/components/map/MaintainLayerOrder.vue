<template></template>

<script setup lang="ts">
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
    newOrder.forEach((layerId) => {
      if (!map.getLayer(layerId)) return

      const beforeId = getBeforeId(layerId, map)
      map.moveLayer(layerId, beforeId)
    })
  },
  { deep: true },
)
</script>
