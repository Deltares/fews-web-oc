<template>
  <div></div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import { toMercator } from '@turf/projection'
import {
  ImageSource,
  LngLatBounds,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  type MapSourceDataEvent,
} from 'maplibre-gl'
import { configManager } from '@/services/application-config'
import { useMap } from 'vue-maplibre-gl'
import { point } from '@turf/helpers'

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

const emit = defineEmits(['doubleclick'])

const { map } = useMap()

let currentLayer: string = ''

onMounted(() => {
  addHooksToMapObject()
  if (map?.isStyleLoaded()) {
    onLayerChange()
  }
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
    event.sourceId === currentLayer &&
    event.tile !== undefined &&
    event.isSourceLoaded
  ) {
    map?.setPaintProperty(event.sourceId, 'raster-opacity', 1)
  }
}

function onDoubleClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('doubleclick', event)
}

function addHooksToMapObject() {
  map?.once('load', () => {
    onLayerChange()

    map.dragRotate.disable()
    map.touchZoomRotate.disableRotation()
    map.doubleClickZoom.disable()
  })
  map?.on('moveend', onMapMove)
  map?.on('sourcedata', onDataChange)
  map?.on('dblclick', onDoubleClick)
}

function removeHooksFromMapObject(): void {
  map?.off('moveend', onMapMove)
  map?.off('sourcedata', onDataChange)
  map?.off('dblclick', onDoubleClick)
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
  const bounds = map.getBounds()
  const canvas = map.getCanvas()

  const getMapUrl = new URL(`${baseUrl}/wms`)
  getMapUrl.searchParams.append('service', 'WMS')
  getMapUrl.searchParams.append('request', 'GetMap')
  getMapUrl.searchParams.append('version', '1.3')
  getMapUrl.searchParams.append('layers', props.layer.name)
  getMapUrl.searchParams.append('crs', 'EPSG:3857')
  getMapUrl.searchParams.append('bbox', `${getMercatorBboxFromBounds(bounds)}`)
  getMapUrl.searchParams.append('height', `${canvas.height}`)
  getMapUrl.searchParams.append('width', `${canvas.width}`)
  getMapUrl.searchParams.append('time', `${time}`)
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
  if (map) {
    const rasterSource: any = {
      type: 'image',
      ...getImageSourceOptions(),
    }
    map.addSource(currentLayer, rasterSource)
    const rasterLayer: any = {
      id: currentLayer,
      type: 'raster',
      source: currentLayer,
      paint: {
        'raster-opacity': 0,
        'raster-opacity-transition': {
          duration: 0,
          delay: 0,
        },
        'raster-fade-duration': 0,
      },
    }
    map.addLayer(rasterLayer, 'boundary_country_outline')
  }
}

function updateSource() {
  if (map === undefined) return
  const source = map.getSource(currentLayer) as ImageSource
  if (source !== undefined) source.updateImage(getImageSourceOptions())
}

function getMercatorBboxFromBounds(bounds: LngLatBounds): number[] {
  const sw = toMercator(point(bounds.getSouthWest().toArray()))
  const ne = toMercator(point(bounds.getNorthEast().toArray()))
  return [...sw.geometry.coordinates, ...ne.geometry.coordinates]
}

function setDefaultZoom() {
  if (props.layer === undefined || props.layer.bbox === undefined) return
  if (map) {
    const currentBounds = map.getBounds()
    const bounds = props.layer.bbox
    if (isBoundsWithinBounds(currentBounds, bounds)) {
      return
    } else {
      nextTick(() => {
        map.fitBounds(bounds)
      })
    }
  }
}

function isBoundsWithinBounds(
  innerBounds: LngLatBounds,
  outerBounds: LngLatBounds,
) {
  const innerNorthEast = innerBounds.getNorthEast()
  const innerSouthWest = innerBounds.getSouthWest()
  const outerNorthEast = outerBounds.getNorthEast()
  const outerSouthWest = outerBounds.getSouthWest()

  const isLngWithin =
    innerSouthWest.lng >= outerSouthWest.lng &&
    innerNorthEast.lng <= outerNorthEast.lng
  const isLatWithin =
    innerSouthWest.lat >= outerSouthWest.lat &&
    innerNorthEast.lat <= outerNorthEast.lat
  return isLngWithin && isLatWithin
}

function removeLayer() {
  if (map !== undefined && map.isStyleLoaded()) {
    if (map.getSource(currentLayer) !== undefined) {
      map.removeLayer(currentLayer)
      map.removeSource(currentLayer)
    }
  }
}

watch(
  () => props.layer,
  () => {
    if (map?.isStyleLoaded()) onLayerChange()
  },
)

function onLayerChange(): void {
  if (props.layer === undefined || props.layer === null) {
    removeLayer()
    return
  }
  if (props.layer.name === undefined || props.layer.time === undefined) {
    return
  }

  if (props.layer.name !== currentLayer) {
    removeLayer()
    currentLayer = props.layer.name
    setDefaultZoom()
  }

  const source = map?.getSource(currentLayer)
  if (source === undefined) {
    createSource()
  } else {
    updateSource()
  }
}
</script>

<style scoped></style>
