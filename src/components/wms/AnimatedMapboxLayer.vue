<template>
  <div></div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, Ref, watch } from 'vue'
import { toMercator } from '@turf/projection'
import {
  ImageSource,
  type ImageSourceOptions,
  type ImageSourceRaw,
  LngLatBounds,
  Map,
  type RasterLayer,
} from 'mapbox-gl'
import { configManager } from '@/services/application-config'
import { useMap } from '@studiometa/vue-mapbox-gl'
import { point } from '@turf/helpers'

export interface MapboxLayerOptions {
  name: string
  time: Date
  bbox?: LngLatBounds
  elevation?: number | null
  colorScaleRange?: string
}

interface Props {
  layer?: MapboxLayerOptions
}

const props = withDefaults(defineProps<Props>(), {})

const { map } = useMap() as { map: Ref<Map> }

let newLayerId!: string
let isInitialized = false
let counter = 0
let currentLayer: string = ''

onMounted(() => {
  if (map.value.isStyleLoaded()) {
    addHooksToMapObject()
    isInitialized = true
    onLayerChange()
  }
})

function getCoordsFromBounds(bounds: LngLatBounds) {
  return [
    bounds.getNorthWest().toArray(),
    bounds.getNorthEast().toArray(),
    bounds.getSouthEast().toArray(),
    bounds.getSouthWest().toArray(),
  ]
}

function addHooksToMapObject() {
  map.value.once('load', () => {
    isInitialized = true
    onLayerChange()
  })
  map.value.on('moveend', () => {
    updateSource()
  })
  map.value.on('data', async (e) => {
    if (e.sourceId === newLayerId && e.tile !== undefined && e.isSourceLoaded) {
      removeOldLayers()
      map.value.setPaintProperty(e.sourceId, 'raster-opacity', 1)
    }
  })
}

function getImageSourceOptions(): ImageSourceOptions {
  if (props.layer === undefined || props.layer.time === undefined) return {}
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const time = props.layer.time.toISOString()
  const bounds = map.value.getBounds()
  const canvas = map.value.getCanvas()

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
  if (props.layer.elevation) {
    getMapUrl.searchParams.append('elevation', `${props.layer.elevation}`)
  }
  const imageSourceOptions = {
    url: getMapUrl.toString(),
    coordinates: getCoordsFromBounds(bounds),
  }
  return imageSourceOptions
}

function updateSource() {
  const source = map.value.getSource(newLayerId) as ImageSource
  source.updateImage(getImageSourceOptions())
}

function getMercatorBboxFromBounds(bounds: LngLatBounds): number[] {
  const sw = toMercator(point(bounds.getSouthWest().toArray()))
  const ne = toMercator(point(bounds.getNorthEast().toArray()))
  return [...sw.geometry.coordinates, ...ne.geometry.coordinates]
}

function setDefaultZoom() {
  if (props.layer === undefined || props.layer.bbox === undefined) return
  if (map.value) {
    const currentBounds = map.value.getBounds()
    const bounds = props.layer.bbox
    if (isBoundsWithinBounds(currentBounds, bounds)) {
      return
    } else {
      nextTick(() => {
        map.value.fitBounds(bounds)
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
  if (map.value !== undefined) {
    const layerId = getFrameId(currentLayer, counter)
    if (map.value.getSource(layerId) !== undefined) {
      map.value.removeLayer(layerId)
      map.value.removeSource(layerId)
    }
  }
}

function getFrameId(layerName: string, frame: number): string {
  return `${layerName}-${frame}`
}

watch(
  () => props.layer,
  () => {
    onLayerChange()
  },
)

function onLayerChange(): void {
  if (!isInitialized) return
  if (props.layer === undefined) return
  if (props.layer === null) {
    removeLayer()
    removeOldLayers()
    return
  }
  if (props.layer.name === undefined || props.layer.time === undefined) {
    return
  }

  const originalLayerName = currentLayer
  if (props.layer.name !== currentLayer) {
    counter += 1
    removeOldLayers()
    counter = 0
    currentLayer = props.layer.name
  }

  counter += 1
  newLayerId = getFrameId(props.layer.name, counter)
  const source = map.value.getSource(newLayerId)
  if (currentLayer !== originalLayerName) {
    // set default zoom only if layer is changed
    setDefaultZoom()
  }

  if (source === undefined) {
    const rasterSource: ImageSourceRaw = {
      type: 'image',
      ...getImageSourceOptions(),
    }
    map.value.addSource(newLayerId, rasterSource)
    const rasterLayer: RasterLayer = {
      id: newLayerId,
      type: 'raster',
      source: newLayerId,
      paint: {
        'raster-opacity': 0,
        'raster-opacity-transition': {
          duration: 0,
          delay: 0,
        },
        'raster-fade-duration': 0,
      },
    }
    map.value.addLayer(rasterLayer, 'boundary_country_outline')
  }
}

function removeOldLayers(): void {
  for (let i = counter - 1; i > 0; i--) {
    const oldLayerId = getFrameId(currentLayer, i)
    if (map.value.getLayer(oldLayerId)) {
      map.value.removeLayer(oldLayerId)
      map.value.removeSource(oldLayerId)
    } else {
      break
    }
  }
}
</script>

<style scoped></style>
