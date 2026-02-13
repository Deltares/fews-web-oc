<template>
  <MapComponent
    :bounds
    :style="mapStyle"
    :showScale="false"
    :showGeolocation="false"
    :showNavigation="false"
  >
    <MapToolsControl />
    <div class="mapcomponent__controls-container pa-2 ga-2">
      <CoordinatesDisplay />
    </div>
    <slot />
  </MapComponent>
</template>

<script setup lang="ts">
import MapComponent from '@/components/map/MapComponent.vue'
import MapToolsControl from '@/components/map/MapToolsControl.vue'
import CoordinatesDisplay from '@/components/map/CoordinatesDisplay.vue'
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
