<template>
  <MapComponent :bounds :style="mapStyle" :showScaleControl="false">
    <MapToolsControl />
    <slot />
  </MapComponent>
</template>

<script setup lang="ts">
import MapComponent from '@/components/map/MapComponent.vue'
import MapToolsControl from '@/components/map/MapToolsControl.vue'
import { useBaseMap } from '@/services/useBaseMap'
import { convertBoundingBoxToLngLatBounds } from '@/services/useWms'
import type { BoundingBox } from '@deltares/fews-pi-requests'
import type { LngLatBounds } from 'maplibre-gl'
import { ref, watch } from 'vue'

interface Props {
  boundingBox?: BoundingBox
}

const props = defineProps<Props>()

const { mapStyle } = useBaseMap()

const bounds = ref<LngLatBounds>()
watch(
  () => props.boundingBox,
  (newBoundingBox) => {
    if (!newBoundingBox) return

    const newBounds = convertBoundingBoxToLngLatBounds(newBoundingBox)

    const boundsChanged = bounds.value?.toString() !== newBounds.toString()
    if (boundsChanged) {
      bounds.value = newBounds
    }
  },
  { immediate: true },
)
</script>
