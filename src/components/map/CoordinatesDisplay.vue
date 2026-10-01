<template>
  <span v-if="enabled && coordinates" class="text-mono mr-2 pa-1 coordinates">
    {{ formatCoordinate(coordinates.lat, 10) }},
    {{ formatCoordinate(coordinates.lng, 11) }}
  </span>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch, computed } from 'vue'
import { useMap } from '@/services/useMap'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { LngLat } from 'maplibre-gl'

const { map } = useMap()
const settings = useUserSettingsStore()

const coordinates = ref<LngLat | null>(null)
const enabled = computed(() => {
  const setting = settings.get('ui.map.showCoordinates')
  return setting && typeof setting.value === 'boolean' ? setting.value : false
})

const formatCoordinate = (value: number, width: number) =>
  value.toFixed(6).padStart(width, '\u00a0') // pad with non-breaking space to keep width stable

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

<style scoped>
.coordinates {
  background: hsla(0, 0%, 100%, 0.75);
}
</style>
