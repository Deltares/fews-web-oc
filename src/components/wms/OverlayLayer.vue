<template>
  <AnimatedRasterLayer
    v-if="options"
    :layer="options"
    :layerId="getLayerId(`overlay-${options.name}`)"
    :sourceId="getSourceId(`overlay-${options.name}`)"
    :key="`overlay-${options.name}`"
    :layerOrder="layerOrder"
  />
</template>

<script setup lang="ts">
import AnimatedRasterLayer from '@/components/wms/AnimatedRasterLayer.vue'
import { getLayerId, getSourceId } from '@/lib/map'
import { Overlay } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  overlay: Overlay
  layerOrder: string[]
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
