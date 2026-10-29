<template></template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useBaseMap } from '@/services/useBaseMap'
import { useMap } from '@/services/useMap'
import { useMapIsDark } from '@/services/useMapIsDark'
import { useUserSettingsStore } from '@/stores/userSettings'
import { MaplibreMeasureControl } from '@watergis/maplibre-gl-terradraw'
import {
  getLineLayerLabelSpec,
  getModeOptions,
  getPolygonLayerSpec,
} from '@/lib/map/terraDraw'
import { useStorage } from '@vueuse/core'
import { GeoJSONStoreFeatures } from 'terra-draw'

const { map } = useMap()
const settings = useUserSettingsStore()
const isDark = useMapIsDark()
const { mapStyle } = useBaseMap()
const isEnabled = computed(
  () => settings.get('ui.map.measuringTools')?.value === true,
)
const features = useStorage<GeoJSONStoreFeatures[]>(
  'weboc-map-features-v1.0.0',
  [],
  sessionStorage,
  { mergeDefaults: true, writeDefaults: false },
)

let measureControl: MaplibreMeasureControl | null = null

/**
 * Adds the measure control and restores the stored features.
 *
 * @param mode The mode to activate. Defaults to the select mode when features
 * are restored.
 */
const addControl = (mode?: string) => {
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
    modeOptions: getModeOptions(isDark.value),
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
    const activeMode =
      mode ?? (features.value.length > 0 ? 'select' : undefined)
    if (activeMode) {
      // The proxied setMode also updates the active button of the control
      terraDrawInstance.setMode(activeMode)
    }
  })
  map.triggerRepaint()
}

function getActiveMode() {
  return measureControl?.getTerraDrawInstance()?.getMode()
}

const removeControl = () => {
  if (!map || !measureControl) return
  map.removeControl(measureControl)
  measureControl = null
}

onMounted(() => {
  watch(
    isEnabled,
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

let isRebuildPending = false
// Active mode of a control that was removed before a base map change
let modeBeforeRebuild: string | undefined

// Rebuilds the control once the map is idle, i.e. when a new style has loaded.
// The drawn features are restored from session storage.
function rebuildControlWhenIdle() {
  if (!map || isRebuildPending) return
  isRebuildPending = true
  map.once('idle', () => {
    isRebuildPending = false
    const mode = modeBeforeRebuild ?? getActiveMode()
    modeBeforeRebuild = undefined
    if (!isEnabled.value) return
    removeControl()
    addControl(mode)
  })
  map.triggerRepaint()
}

// A new base map style drops the TerraDraw layers and sources, after which the
// control can no longer be removed cleanly. Therefore remove it synchronously,
// before the map component applies the new style.
watch(
  mapStyle,
  () => {
    if (!measureControl) return
    modeBeforeRebuild = getActiveMode()
    removeControl()
    rebuildControlWhenIdle()
  },
  { flush: 'sync' },
)

// Rebuild the control so the paint styles follow the base map theme.
watch(isDark, () => {
  if (!measureControl) return
  rebuildControlWhenIdle()
})

onBeforeUnmount(() => {
  removeControl()
})
</script>
