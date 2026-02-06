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
import { useDark, useStorage } from '@vueuse/core'
import { GeoJSONStoreFeatures } from 'terra-draw'

const { map } = useMap()
const settings = useUserSettingsStore()
const isDark = useDark()
const features = useStorage<GeoJSONStoreFeatures[]>(
  'weboc-map-features-v1.0.0',
  [],
  sessionStorage,
  { mergeDefaults: true, writeDefaults: false },
)

let measureControl: MaplibreMeasureControl | null = null

const addControl = () => {
  if (!map) return

  measureControl = new MaplibreMeasureControl({
    modes: [
      'select',
      'linestring',
      'rectangle',
      'polygon',
      'circle',
      'freehand',
      'delete',
    ],
    open: true,
    modeOptions: getModeOtions(isDark.value),
    pointLayerLabelSpec: getPointLayerLabelSpec(isDark.value),
    lineLayerLabelSpec: getLineLayerLabelSpec(isDark.value),
    polygonLayerSpec: getPolygonLayerSpec(isDark.value),
  })
  map.addControl(measureControl, 'top-right')

  const terraDrawInstance = measureControl.getTerraDrawInstance()
  terraDrawInstance.on('finish', (e) => {
    features.value = terraDrawInstance.getSnapshot()
  })
  measureControl.on('feature-deleted', () => {
    features.value = terraDrawInstance.getSnapshot()
  })

  if (features.value.length > 0) {
    map.once('idle', () => {
      terraDrawInstance.addFeatures(features.value)
      measureControl?.recalc()
    })
  }
}

const removeControl = () => {
  if (!map || !measureControl) return
  map.removeControl(measureControl)
  measureControl = null
}

onMounted(() => {
  const enabled = settings.get('ui.map.measuringTools')?.value ?? false
  if (enabled) {
    addControl()
  }
})

watch(
  () => settings.get('ui.map.measuringTools')?.value ?? false,
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
)

onBeforeUnmount(() => {
  if (measureControl) {
    removeControl()
  }
})
</script>

<style scoped></style>
