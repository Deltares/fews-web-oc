<template>
  <AnimatedRasterLayer :layerOptions="options" :layerId :sourceId :beforeId />
</template>

<script setup lang="ts">
import AnimatedRasterLayer from '@/components/wms/AnimatedRasterLayer.vue'
import {
  getBeforeId,
  getLayerId,
  getSourceId,
  type LayerOptions,
  mapIds,
} from '@/lib/map'
import { Overlay } from '@deltares/fews-pi-requests'
import { computed } from 'vue'
import { useMap } from '@/services/useMap'

interface Props {
  beforeId: string | undefined
  overlay: Overlay
  overlays: Overlay[]
  layerOptions: LayerOptions
}

const emit = defineEmits(['doubleclick'])
const props = defineProps<Props>()

const layerId = computed(() => getOverlayLayerId(props.overlay))
const sourceId = computed(() => getOverlaySourceId(props.overlay))

const options = computed(() => ({
  name: props.overlay.id!,
  layerType: 'static',
}))

const { map } = useMap()

function prefix(overlay: Overlay): string {
  return `overlay-${overlay.id}`
}

function getOverlayLayerId(overlay: Overlay): string {
  switch (overlay.type) {
    case 'overLay':
      return getLayerId(prefix(overlay))
    case 'gridLayer':
      return mapIds.wms.layer
  }
}

function getOverlaySourceId(overlay: Overlay): string {
  switch (overlay.type) {
    case 'overLay':
      return getSourceId(prefix(overlay))
    case 'gridLayer':
      return mapIds.wms.source
  }
}

const beforeId = computed(() => {
  if (!map) return

  const layerIds = map.getLayersOrder()

  // Find the index of the next overlay layer that has a layerId in the map
  const overlayIndex = props.overlays.findIndex(
    (o) =>
      o.id === props.overlay.id
  )
  for (let i = overlayIndex + 1; i < props.overlays.length; i++) {
    const nextOverlay = props.overlays[i]
    const nextLayerId = getOverlayLayerId(nextOverlay)
    if (layerIds.includes(nextLayerId)) {
      return nextLayerId
    }
  }
  return getBeforeId(map, layerId.value, props.beforeId)
})
</script>
