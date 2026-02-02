<template></template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useMap } from '@/services/useMap'
import { useUserSettingsStore } from '@/stores/userSettings'
import MeasuresControl from 'maplibre-gl-measures'

const { map } = useMap()
const settings = useUserSettingsStore()

let measureControls: MeasuresControl | null = null

const addControl = () => {
  if (!map || measureControls) return

  measureControls = new MeasuresControl({
    units: 'metric',
  })
  map.addControl(measureControls, 'top-right')
}

const removeControl = () => {
  if (!map || !measureControls) return

  map.removeControl(measureControls)
  measureControls = null
}

watch(
  () => settings.get('ui.map.tools')?.value ?? false,
  (enabled) => {
    if (!map) return

    if (enabled) {
      if (!measureControls) {
        addControl()
      }
    } else {
      if (measureControls) {
        removeControl()
      }
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (measureControls) {
    removeControl()
  }
})
</script>

<style scoped></style>
