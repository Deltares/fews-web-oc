<template></template>

<script setup lang="ts">
import { onBeforeUnmount, watch, onBeforeMount } from 'vue'
import { TerraDraw, TerraDrawRectangleMode } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { useMap } from '@/services/useMap'
import type {
  FeatureId,
  GeoJSONStoreFeatures,
} from 'node_modules/terra-draw/dist/store/store'
import { BoundingBox } from '@/services/useBoundingBox'
import { Position } from 'geojson'

const modelValue = defineModel<BoundingBox | null>({ default: null })

const { map } = useMap()
if (!map) throw new Error('Map is not available to draw rectangle on.')

const mapLibreAdapter = new TerraDrawMapLibreGLAdapter({ map })
mapLibreAdapter.setDraggability(false)
mapLibreAdapter.setDoubleClickToZoom(false)
const rectangleMode = new TerraDrawRectangleMode({
  styles: {
    fillColor: '#c2bebe',
    outlineColor: '#626262',
    outlineWidth: 2,
    fillOpacity: 0.4,
  },
})

const draw = new TerraDraw({
  adapter: mapLibreAdapter,
  modes: [rectangleMode],
})

draw.on('ready', updateFromModelValue)

draw.on('finish', (featureId) => {
  const features = draw.getSnapshot()
  const newFeature = features.find((feature) => feature.id === featureId)
  if (newFeature) {
    const coordinates = newFeature.geometry.coordinates[0] as Position[]
    const lon = coordinates.map((coord) => coord[0])
    const lat = coordinates.map((coord) => coord[1])
    modelValue.value = {
      lonMin: Math.min(...lon),
      lonMax: Math.max(...lon),
      latMin: Math.min(...lat),
      latMax: Math.max(...lat),
    }
  } else {
    modelValue.value = null
  }
})

draw.on('change', (featureIds, type) => {
  if (type == 'create') {
    if (!featureIds.length) return
    const newFeature = featureIds[0]

    removeAllFeaturesExcept(newFeature)
  }
})

function removeAllFeaturesExcept(featureId: FeatureId) {
  const features = draw.getSnapshot()
  const toRemove = features
    .filter((feature) => feature.id !== featureId)
    .map((feature) => feature.id)

  draw.removeFeatures(toRemove as FeatureId[])
}

onBeforeMount(() => {
  draw.start()
  draw.setMode('rectangle')
})

onBeforeUnmount(() => {
  draw.setMode('static')
  draw.stop()
})

watch(modelValue, updateFromModelValue, { deep: true })
function updateFromModelValue() {
  draw.clear()
  if (modelValue.value !== null) {
    // Round to 9 decimal places as this is the default max precision in terra draw
    // https://github.com/JamesLMilner/terra-draw/blob/main/src/adapters/common/base.adapter.ts#L46
    const round = (value: number) => {
      return Math.round(value * 1000000000) / 1000000000
    }

    const lonMin = round(modelValue.value.lonMin)
    const lonMax = round(modelValue.value.lonMax)
    const latMin = round(modelValue.value.latMin)
    const latMax = round(modelValue.value.latMax)

    const feature: GeoJSONStoreFeatures = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [lonMin, latMin],
            [lonMax, latMin],
            [lonMax, latMax],
            [lonMin, latMax],
            [lonMin, latMin],
          ],
        ],
      },
      properties: {
        mode: 'rectangle',
      },
    }
    draw.addFeatures([feature])
  }
}
</script>
