<template>
  <AnimatedRasterLayer
    v-if="options"
    :layer="options"
    :layerId="getLayerId(`overlay-${options.name}`)"
    :sourceId="getSourceId(`overlay-${options.name}`)"
    :beforeId="beforeId"
    :key="`overlay-${options.name}`"
  />
</template>

<script setup lang="ts">
import AnimatedRasterLayer from '@/components/wms/AnimatedRasterLayer.vue'
import { getLayerId, getSourceId } from '@/lib/map'
import { Overlay } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  overlay: Overlay
  beforeId?: string
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
