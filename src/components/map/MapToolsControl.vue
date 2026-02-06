<template></template>

<script setup lang="ts">
import { onBeforeUnmount, watch, onMounted } from 'vue'
import { useMap } from '@/services/useMap'
import { useUserSettingsStore } from '@/stores/userSettings'
import { MaplibreMeasureControl } from '@watergis/maplibre-gl-terradraw'
import {
  getLineLayerLabelSpec,
  getModeOtions,
  getPointLayerLabelSpec,
  getPolygonLayerSpec,
} from '@/lib/map/terraDraw'
import { useDark } from '@vueuse/core'

const { map } = useMap()
const settings = useUserSettingsStore()
const isDark = useDark()

let measureControl: MaplibreMeasureControl | null = null

const addControl = () => {
  if (!map || measureControl) return

  measureControl = new MaplibreMeasureControl({
    modes: [
      'select',
      'linestring',
      'rectangle',
      'polygon',
      'circle',
      'freehand',
      'delete',
      'download',
    ],
    open: true,
    modeOptions: getModeOtions(isDark.value),
    pointLayerLabelSpec: getPointLayerLabelSpec(isDark.value),
    lineLayerLabelSpec: getLineLayerLabelSpec(isDark.value),
    polygonLayerSpec: getPolygonLayerSpec(isDark.value),
  })
  map.addControl(measureControl, 'top-right')
}

const removeControl = () => {
  if (!map || !measureControl) return
  map.removeControl(measureControl)
  measureControl = null
}

onMounted(() => {
  watch(
    () => settings.get('ui.map.tools')?.value ?? false,
    (enabled) => {
      if (!map) {
        console.warn('Map is not available')
        return
      }

      if (enabled) {
        if (!measureControl) {
          addControl()
        }
      } else {
        if (measureControl) {
          removeControl()
        }
      }
    },
    { immediate: true },
  )
})

onBeforeUnmount(() => {
  if (measureControl) {
    removeControl()
  }
})
</script>

<style scoped></style>
