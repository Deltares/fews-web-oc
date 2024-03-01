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
import { Feature } from 'geojson'

interface Props {
  modelValue?: Feature[]
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

rectangleMode.onFinish = () => {
  const features = draw.getSnapshot()
  emit('update:modelValue', features)

  draw.setMode('static')
}

onBeforeMount(() => {
  draw.start()
  draw.setMode('rectangle')
})

onBeforeUnmount(() => {
  draw.clear()
  draw.stop()
})

watch(props.modelValue, () => {
  if (props.modelValue.length > 0) {
    draw.clear()
    draw.addFeatures(props.modelValue as GeoJSONStoreFeatures[])
  }
})
</script>
