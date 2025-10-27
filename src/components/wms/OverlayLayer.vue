<template>
  <AnimatedRasterLayer
    v-if="options"
    :layer="options"
    :key="`overlay-${options.name}`"
    :beforeId="beforeId"
  />
</template>

<script setup lang="ts">
import AnimatedRasterLayer, {
  AnimatedRasterLayerOptions,
} from '@/components/wms/AnimatedRasterLayer.vue'
import { locationLayerIds } from '@/lib/map'
import { Overlay } from '@deltares/fews-pi-requests'
import { computed } from 'vue'
import { useMap } from '@/services/useMap'

interface Props {
  overlay: Overlay
  layerOptions: AnimatedRasterLayerOptions
}

const props = defineProps<Props>()

const options = computed(() => {
  if (!props.overlay.id) return
  return {
    ...props.layerOptions,
    name: props.overlay.id,
    layerType: 'static',
  }
})

const { map } = useMap()

const beforeId = computed(() => {
  if (!map) return

  const layerIds = map.getLayersOrder()
  return layerIds.find((id) => locationLayerIds.includes(id))
})
</script>
