<template>
  <ControlChip v-if="enabled && coordinates">
    <v-icon start size="small">mdi-map-marker</v-icon>
    <span>
      {{ coordinates.lat.toFixed(6) }}, {{ coordinates.lng.toFixed(6) }}
    </span>
  </ControlChip>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch, computed } from 'vue'
import { useMap } from '@/services/useMap'
import { useUserSettingsStore } from '@/stores/userSettings'
import ControlChip from '@/components/wms/ControlChip.vue'
import type { LngLat } from 'maplibre-gl'

const { map } = useMap()
const settings = useUserSettingsStore()

const coordinates = ref<LngLat | null>(null)
const enabled = computed(() => {
  const setting = settings.get('ui.map.showCoordinates')
  return setting && typeof setting.value === 'boolean' ? setting.value : false
})

const onMouseMove = (event: any) => {
  if (!map) return
  coordinates.value = event.lngLat
}

watch(
  () => enabled.value,
  (newEnabled) => {
    if (newEnabled && map) {
      map.on('mousemove', onMouseMove)
    } else if (map) {
      map.off('mousemove', onMouseMove)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (map) {
    map.off('mousemove', onMouseMove)
  }
})
</script>
