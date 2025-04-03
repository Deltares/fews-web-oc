<template>
  <div></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { toMercator } from '@turf/projection'
import {
  ImageSource,
  LngLat,
  LngLatBounds,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  type MapSourceDataEvent,
} from 'maplibre-gl'
import { configManager } from '@/services/application-config'
import { useMap } from '@/services/useMap'
import { point } from '@turf/helpers'
import { getBeforeId, getLayerId, getSourceId } from '@/lib/map'

export interface AnimatedRasterLayerOptions {
  name: string
  time: Date
  useDisplayUnits?: boolean
  bbox?: LngLatBounds
  elevation?: number | null
  colorScaleRange?: string
  style?: string
}

interface Props {
  layer?: AnimatedRasterLayerOptions
}

const props = withDefaults(defineProps<Props>(), {})
const isLoading = defineModel<boolean>('isLoading', { default: false })

const emit = defineEmits(['doubleclick'])

const { map } = useMap()

let currentLayer = ''
let currentSource = ''

onMounted(() => {
  addHooksToMapObject()
  onLayerChange()
})

onUnmounted(() => {
  removeLayer()
  removeHooksFromMapObject()
})

function getCoordsFromBounds(bounds: LngLatBounds) {
  return [
    bounds.getNorthWest().toArray(),
    bounds.getNorthEast().toArray(),
    bounds.getSouthEast().toArray(),
    bounds.getSouthWest().toArray(),
  ]
}

function onMapMove(): void {
  updateSource()
}

function onDataChange(event: MapSourceDataEvent): void {
  if (
    event.sourceId === currentSource &&
    event.tile !== undefined &&
    event.isSourceLoaded
  ) {
    map?.setPaintProperty(currentLayer, 'raster-opacity', 1)
  }
}

function onDoubleClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('doubleclick', event)
}

function onStartLoading(e: MapSourceDataEvent): void {
  if (e.sourceId !== currentSource) return
  isLoading.value = true
}

function onEndLoading(e: MapSourceDataEvent): void {
  if (e.sourceId !== currentSource) return
  isLoading.value = false
}

function onError(e: ErrorEvent) {
  // NOTE: All maplibre errors are printed to the console
  //       if no error event listener is added. Abort errors
  //       happen mostly when the user moves the map before
  //       the image is loaded. This is almost never an error.
  if (e.error.name === 'AbortError') {
    return
  }
  console.error(e)
}

function addHooksToMapObject() {
  map?.on('load', onLayerChange)
  map?.on('moveend', onMapMove)
  map?.on('sourcedata', onDataChange)
  map?.on('dblclick', onDoubleClick)
  map?.on('dataloading', onStartLoading)
  map?.on('sourcedata', onEndLoading)
  map?.on('error', onError)
}

function removeHooksFromMapObject(): void {
  map?.off('load', onLayerChange)
  map?.off('moveend', onMapMove)
  map?.off('sourcedata', onDataChange)
  map?.off('dblclick', onDoubleClick)
  map?.off('dataloading', onStartLoading)
  map?.off('sourcedata', onEndLoading)
  map?.off('error', onError)
}

function getImageSourceOptions(): any {
  if (
    props.layer === undefined ||
    props.layer.time === undefined ||
    map === undefined
  )
    return {}
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const time = props.layer.time.toISOString()
  let bounds = map.getBounds()
  let { width, height } = map.getCanvas()

  // Check if we have a multiple Earths on the map
  // Then reduce the bounds and image width to contain only one Earth
  if (bounds.getEast() - bounds.getWest() > 360) {
    width = (width * 360) / (bounds.getEast() - bounds.getWest())
    bounds = new LngLatBounds(
      new LngLat(-180, bounds.getSouth()),
      new LngLat(180, bounds.getNorth()),
    )
  }

  const getMapUrl = new URL(`${baseUrl}/wms`)
  getMapUrl.searchParams.append('service', 'WMS')
  getMapUrl.searchParams.append('request', 'GetMap')
  getMapUrl.searchParams.append('version', '1.3')
  getMapUrl.searchParams.append('layers', props.layer.name)
  getMapUrl.searchParams.append('crs', 'EPSG:3857')
  getMapUrl.searchParams.append('bbox', `${getMercatorBboxFromBounds(bounds)}`)
  // Width and height are in pixels, this can cause the image can be distorted a bit relicative to the bbox coordinates
  getMapUrl.searchParams.append('height', `${height.toFixed(0)}`)
  getMapUrl.searchParams.append('width', `${width.toFixed(0)}`)
  getMapUrl.searchParams.append('time', `${time}`)
  getMapUrl.searchParams.append('useLastValue', 'true')
  if (props.layer.style) {
    getMapUrl.searchParams.append('styles', props.layer.style)
  }
  if (props.layer.elevation) {
    getMapUrl.searchParams.append('elevation', `${props.layer.elevation}`)
  }
  if (props.layer.colorScaleRange) {
    getMapUrl.searchParams.append(
      'colorScaleRange',
      `${props.layer.colorScaleRange}`,
    )
    getMapUrl.searchParams.append(
      'useDisplayUnits',
      props.layer.useDisplayUnits ? 'true' : 'false',
    )
  }
  const imageSourceOptions = {
    url: getMapUrl.toString(),
    coordinates: getCoordsFromBounds(bounds),
  }
  return imageSourceOptions
}

function createSource() {
  if (!map?.isStyleLoaded()) return

  const rasterSource: any = {
    type: 'image',
    ...getImageSourceOptions(),
  }
  map.addSource(currentSource, rasterSource)
  const rasterLayer: any = {
    id: currentLayer,
    type: 'raster',
    source: currentSource,
    paint: {
      'raster-opacity': 0,
      'raster-opacity-transition': {
        duration: 0,
        delay: 0,
      },
      'raster-fade-duration': 0,
    },
  }
  const beforeId = getBeforeId(map)
  map.addLayer(rasterLayer, beforeId)
}

function updateSource() {
  if (map === undefined) return
  const source = map.getSource(currentSource) as ImageSource
  if (source !== undefined) source.updateImage(getImageSourceOptions())
}

function getMercatorBboxFromBounds(bounds: LngLatBounds): number[] {
  const sw = toMercator(point(bounds.getSouthWest().toArray()))
  const ne = toMercator(point(bounds.getNorthEast().toArray()))
  return [...sw.geometry.coordinates, ...ne.geometry.coordinates]
}

function removeLayer() {
  if (map !== undefined && map.style !== undefined) {
    if (map.getSource(currentSource) !== undefined) {
      map.removeLayer(currentLayer)
      map.removeSource(currentSource)
    }
  }
}

watch(() => props.layer, onLayerChange)
function onLayerChange(): void {
  if (props.layer === undefined || props.layer === null) {
    removeLayer()
    return
  }
  if (props.layer.name === undefined || props.layer.time === undefined) {
    return
  }

  const layerId = getLayerId(props.layer.name)
  const sourceId = getSourceId(props.layer.name)

  if (layerId !== currentLayer) {
    removeLayer()
    currentLayer = layerId
    currentSource = sourceId
  }

  const source = map?.getSource(currentSource)
  if (source === undefined) {
    createSource()
  } else {
    updateSource()
  }
}
</script>

<style scoped></style>
