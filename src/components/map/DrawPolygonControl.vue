<template></template>

<script setup lang="ts">
import { onBeforeUnmount, watch, onBeforeMount } from 'vue'
import {
  GeoJSONStoreFeatures,
  TerraDraw,
  TerraDrawMapLibreGLAdapter,
  TerraDrawRectangleMode,
} from 'terra-draw'
import { useMap } from 'vue-maplibre-gl'
import type { FeatureId } from 'node_modules/terra-draw/dist/store/store'

interface Props {
  modelValue?: GeoJSONStoreFeatures[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
})

const emit = defineEmits(['update:modelValue'])
const { map } = useMap()
if (!map) throw new Error('Map is not available to draw polygon')

const mapLibreAdapter = new TerraDrawMapLibreGLAdapter({ map })
const rectangleMode = new TerraDrawRectangleMode()

const draw = new TerraDraw({
  adapter: mapLibreAdapter,
  modes: [rectangleMode],
})

draw.on('finish', (featureId) => {
  const features = draw.getSnapshot()
  const newFeature = features.find((feature) => feature.id === featureId)
  emit('update:modelValue', [newFeature])
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
  draw.stop()
})

watch(
  () => props.modelValue,
  () => {
    if (props.modelValue.length > 0) {
      draw.clear()
      draw.addFeatures(props.modelValue)
    }
  },
  { deep: true },
)
</script>
