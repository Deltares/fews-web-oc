<template></template>

<script setup lang="ts">
import {
  type GeoJSONSourceSpecification,
  type MapMouseEvent,
  type MapTouchEvent,
  type LngLat,
  Popup,
} from 'maplibre-gl'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getLayerId, getSourceId } from '@/lib/map'
import { useMap } from '@/services/useMap'
import { useLayer, useSource } from '@/services/useLayer'

interface Props {
  coordinate?: LngLat
}

const props = defineProps<Props>()
const emit = defineEmits(['coordinate-moved'])

const { map } = useMap()
if (!map) throw new Error('Map is not available to show selected coordinate')
const canvas = map.getCanvasContainer()

const layerId = getLayerId('selected-coordinate')
const sourceId = getSourceId('selected-coordinate')

const paintSpecification = {
  'circle-radius': 8,
  'circle-color': 'blue',
  'circle-stroke-color': 'white',
  'circle-stroke-width': 2.5,
}

const tooltipPopup = new Popup({
  closeButton: false,
  closeOnClick: false,
  className: 'coordinate-info-popup',
  maxWidth: 'none',
  anchor: 'bottom',
})

const coordinate = ref<LngLat>()
watch(
  () => props.coordinate,
  () => {
    coordinate.value = props.coordinate
  },
  { immediate: true },
)

watch(coordinate, () => {
  if (!coordinate.value) return

  tooltipPopup
    .setText(
      `${coordinate.value.lat.toFixed(3)}, ${coordinate.value.lng.toFixed(3)}`,
    )
    .setLngLat(coordinate.value)
})

type DataType = GeoJSONSourceSpecification['data']
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

const { source } = useSource(sourceId, () => ({
  type: 'geojson',
  data: geoJson.value,
}))
useLayer(
  layerId,
  () => ({
    id: layerId,
    type: 'circle',
    paint: paintSpecification,
    source: sourceId,
  }),
  source,
)

const onMove = (e: MapMouseEvent) => {
  coordinate.value = e.lngLat
  canvas.style.cursor = 'grabbing'
}

const onUp = () => {
  map.off('mousemove', onMove)
  map.off('touchmove', onMove)

  canvas.style.cursor = ''

  tooltipPopup.remove()

  if (!coordinate.value) return
  emit('coordinate-moved', coordinate.value.lat, coordinate.value.lng)
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

  tooltipPopup.addTo(map)
  map.on('mousemove', onMove)
  document.addEventListener('mouseup', onUp, { once: true })
}

const touchstart = (e: MapTouchEvent) => {
  if (e.points.length !== 1) return

  e.preventDefault()

  tooltipPopup.addTo(map)
  map.on('touchmove', onMove)
  document.addEventListener('touchend', onUp, { once: true })
}

onMounted(() => {
  if (!map) return

  map.on('mouseenter', layerId, mouseenter)
  map.on('mouseleave', layerId, mouseleave)
  map.on('mousedown', layerId, mousedown)
  map.on('touchstart', layerId, touchstart)
})

onUnmounted(() => {
  if (!map) return

  map.off('mouseenter', layerId, mouseenter)
  map.off('mouseleave', layerId, mouseleave)
  map.off('mousedown', layerId, mousedown)
  map.off('touchstart', layerId, touchstart)
})
</script>

<!-- Has to be unscoped since tooltip is placed in map canvas dom element -->
<style>
:root {
  --coordinate-tooltip-color-primary: #000;
  --coordinate-tooltip-color-secondary: #fff;
}

.dark {
  --coordinate-tooltip-color-primary: #fff;
  --coordinate-tooltip-color-secondary: #000;
}

.coordinate-info-popup {
  font-family: var(--font-family);
  display: flex;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  will-change: transform;
  flex-direction: column-reverse;
  font-size: 0.75rem;
}

.coordinate-info-popup .maplibregl-popup-tip {
  border: 5px solid transparent;
  height: 0;
  width: 0;
  z-index: 1;
  align-self: center;
  border-bottom: none;
  border-top-color: var(--coordinate-tooltip-color-secondary);
}

.coordinate-info-popup .maplibregl-popup-content {
  color: var(--coordinate-tooltip-color-primary);
  background: var(--coordinate-tooltip-color-secondary);
  border-radius: 3px;
  padding: 2px 8px;
  pointer-events: auto;
  position: relative;
}
</style>
