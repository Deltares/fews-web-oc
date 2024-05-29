<template>
  <mgl-geo-json-source :source-id="sourceId" :data="geoJson">
    <mgl-circle-layer
      :layer-id="layerId"
      :paint="paintSpecification"
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
      @mousedown="mousedown"
      @touchstart="touchstart"
    />
  </mgl-geo-json-source>
</template>

<script setup lang="ts">
import { LngLat, MapMouseEvent, MapTouchEvent } from 'maplibre-gl'
import { computed, ref, watch } from 'vue'
import { MglGeoJsonSource, MglCircleLayer, useMap } from 'vue-maplibre-gl'

interface Props {
  coordinate?: LngLat
}

const props = defineProps<Props>()
const emit = defineEmits(['coordinate-moved'])

const coordinate = ref<LngLat>()
watch(
  () => props.coordinate,
  () => {
    coordinate.value = props.coordinate
  },
  { immediate: true },
)

type DataType = InstanceType<typeof MglGeoJsonSource>['data']
const geoJson = computed<DataType>(() => {
  if (!coordinate.value) {
    return {
      type: 'FeatureCollection',
      features: [],
    }
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Point',
      coordinates: coordinate.value.toArray(),
    },
  }
})

const { map } = useMap()
if (!map) throw new Error('Map is not available to show selected coordinate')
const canvas = map.getCanvasContainer()

const layerId = 'selected-coordinate-layer'
const sourceId = 'selected-coordinate-source'

const paintSpecification = {
  'circle-radius': 8,
  'circle-color': 'blue',
  'circle-stroke-color': 'white',
  'circle-stroke-width': 2.5,
}
const onMove = (e: MapMouseEvent) => {
  coordinate.value = e.lngLat
  canvas.style.cursor = 'grabbing'
}

const onUp = (e: MapMouseEvent) => {
  map.off('mousemove', onMove)
  map.off('touchmove', onMove)

  canvas.style.cursor = ''

  const coords = e.lngLat

  emit('coordinate-moved', coords.lat, coords.lng)
}

const mouseenter = () => {
  canvas.style.cursor = 'move'
}

const mouseleave = () => {
  canvas.style.cursor = ''
}

const mousedown = (e: MapMouseEvent) => {
  e.preventDefault()

  canvas.style.cursor = 'grab'

  map.on('mousemove', onMove)
  map.once('mouseup', onUp)
}

const touchstart = (e: MapTouchEvent) => {
  if (e.points.length !== 1) return

  e.preventDefault()

  map.on('touchmove', onMove)
  map.once('touchend', onUp)
}
</script>
