<template></template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useMap } from '@/services/useMap'
import { useMapIsDark } from '@/services/useMapIsDark'
import { useUserSettingsStore } from '@/stores/userSettings'
import { MaplibreMeasureControl } from '@watergis/maplibre-gl-terradraw'
import {
  getLineLayerLabelSpec,
  getModeOtions,
  getPointLayerLabelSpec,
  getPolygonLayerSpec,
} from '@/lib/map/terraDraw'
import { useStorage } from '@vueuse/core'
import { GeoJSONStoreFeatures } from 'terra-draw'

const { map } = useMap()
const settings = useUserSettingsStore()
const isDark = useMapIsDark()
const features = useStorage<GeoJSONStoreFeatures[]>(
  'weboc-map-features-v1.0.0',
  [],
  sessionStorage,
  { mergeDefaults: true, writeDefaults: false },
)

let measureControl: MaplibreMeasureControl | null = null

const addControl = () => {
  if (!map || measureControl) return

  const control = new MaplibreMeasureControl({
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
  measureControl = control
  map.addControl(control, 'top-right')

  const terraDrawInstance = control.getTerraDrawInstance()
  if (!terraDrawInstance) {
    console.warn('TerraDraw instance is not available')
    return
  }

  terraDrawInstance.on('finish', () => {
    features.value = terraDrawInstance.getSnapshot()
  })
  control.on('feature-deleted', () => {
    features.value = terraDrawInstance.getSnapshot()
  })

  map.once('idle', () => {
    // The control may have been removed or replaced before the map was idle
    if (measureControl !== control) return
    // The control only starts TerraDraw on the map 'load' event when the style
    // is not loaded yet, which does not fire again after a base map change.
    terraDrawInstance.start()
    try {
      if (features.value.length > 0) {
        terraDrawInstance.addFeatures(features.value)
      }
      control.recalc()
    } catch (error) {
      // Keep the stored features, so they are not lost by a failed restore
      console.warn('Failed to restore measured features', error)
    }
  })
}

const removeControl = () => {
  if (!map || !measureControl) return
  map.removeControl(measureControl)
  measureControl = null
}

onMounted(() => {
  watch(
    () => settings.get('ui.map.measuringTools')?.value ?? false,
    (enabled) => {
      if (!map) {
        console.warn('Map is not available')
        return
      }
      if (enabled) {
        addControl()
      } else {
        removeControl()
      }
    },
    { immediate: true },
  )
})

// Rebuild the control so the paint styles follow the base map theme; the
// drawn features are restored from session storage. A theme change usually
// comes with a base map change, so wait until the new style has loaded.
watch(isDark, () => {
  if (!map || !measureControl) return
  map.once('idle', () => {
    if (!measureControl) return
    removeControl()
    addControl()
  })
  map.triggerRepaint()
})

onBeforeUnmount(() => {
  removeControl()
})
</script>
