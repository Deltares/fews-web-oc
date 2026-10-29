<template></template>

<script setup lang="ts">
import { watch } from 'vue'
import { useMap } from '@/services/useMap'
import { useMapIsDark } from '@/services/useMapIsDark'

// Adds a map--dark or map--light class to the map container, so that elements
// drawn on top of the map can be styled to match the base map.
const { map } = useMap()
const isDark = useMapIsDark()

watch(
  isDark,
  (dark) => {
    const container = map?.getContainer()
    container?.classList.toggle('map--dark', dark)
    container?.classList.toggle('map--light', !dark)
  },
  { immediate: true },
)
</script>
