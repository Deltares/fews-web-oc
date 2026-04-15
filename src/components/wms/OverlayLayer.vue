<template>
  <AnimatedRasterLayer
    v-if="options"
    :layer="options"
    :opacity="overlay.opacity"
    :layerId="getLayerId(`overlay-${options.name}`)"
    :sourceId="getSourceId(`overlay-${options.name}`)"
    :key="`overlay-${options.name}`"
  />
</template>

<script setup lang="ts">
import AnimatedRasterLayer from '@/components/wms/AnimatedRasterLayer.vue'
import { getLayerId, getSourceId } from '@/lib/map'
import type { Overlay } from '@/services/useOverlays'
import { computed } from 'vue'

interface Props {
  overlay: Overlay
}

const props = defineProps<Props>()

const options = computed(() => {
  if (!props.overlay.id) return
  return {
    name: props.overlay.id,
    layerType: 'static',
  }
})
</script>
