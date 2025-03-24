<template>
  <MapComponent :bounds :baseMapId :showScaleControl="false">
    <slot />
  </MapComponent>
</template>

<script setup lang="ts">
import MapComponent from '@/components/map/MapComponent.vue'
import { convertBoundingBoxToLngLatBounds } from '@/services/useWms'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { BoundingBox } from '@deltares/fews-pi-requests'
import type { LngLatBounds } from 'maplibre-gl'
import { computed, ref, watch } from 'vue'

interface Props {
  boundingBox?: BoundingBox
}

const props = defineProps<Props>()

const userSettingsStore = useUserSettingsStore()
const baseMapId = computed(
  () => (userSettingsStore.get('ui.map.theme')?.value as string) ?? 'automatic',
)

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
