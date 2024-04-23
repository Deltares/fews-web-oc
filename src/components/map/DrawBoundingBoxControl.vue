<template></template>

<script setup lang="ts">
import { onBeforeUnmount, watch, onBeforeMount } from 'vue'
import {
  TerraDraw,
  TerraDrawMapLibreGLAdapter,
  TerraDrawRectangleMode,
} from 'terra-draw'
import { useMap } from 'vue-maplibre-gl'
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

watch(
  modelValue,
  () => {
    draw.clear()
    if (modelValue.value !== null) {
      const feature: GeoJSONStoreFeatures = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [modelValue.value.lonMin, modelValue.value.latMin],
              [modelValue.value.lonMax, modelValue.value.latMin],
              [modelValue.value.lonMax, modelValue.value.latMax],
              [modelValue.value.lonMin, modelValue.value.latMax],
              [modelValue.value.lonMin, modelValue.value.latMin],
            ],
          ],
        },
        properties: {
          mode: 'rectangle',
        },
      }
      draw.addFeatures([feature])
    }
  },
  { deep: true },
)
</script>
