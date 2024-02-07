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

const emit = defineEmits(['doubleclick'])

const { map } = useMap() as { map: Ref<Map> }

let isInitialized = false
let currentLayer: string = ''
let cachedRequests: Record<string, ImageSourceOptions> = {}

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
    if (
      e.sourceId === currentLayer &&
      e.tile !== undefined &&
      e.isSourceLoaded
    ) {
      map.value.setPaintProperty(e.sourceId, 'raster-opacity', 1)
    }
  })
  map.value.on('dblclick', (e) => emit('doubleclick', e))
}

function getImageSourceOptions(layer: MapboxLayerOptions | undefined): ImageSourceOptions {
  if (layer === undefined || layer.time === undefined) return {}
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const time = layer.time.toISOString()
  const bounds = map.value.getBounds()
  const canvas = map.value.getCanvas()

  const getMapUrl = new URL(`${baseUrl}/wms`)
  getMapUrl.searchParams.append('service', 'WMS')
  getMapUrl.searchParams.append('request', 'GetMap')
  getMapUrl.searchParams.append('version', '1.3')
  getMapUrl.searchParams.append('layers', layer.name)
  getMapUrl.searchParams.append('crs', 'EPSG:3857')
  getMapUrl.searchParams.append('bbox', `${getMercatorBboxFromBounds(bounds)}`)
  getMapUrl.searchParams.append('height', `${canvas.height}`)
  getMapUrl.searchParams.append('width', `${canvas.width}`)
  getMapUrl.searchParams.append('time', `${time}`)
  if (layer.elevation) {
    getMapUrl.searchParams.append('elevation', `${layer.elevation}`)
  }
  const imageSourceOptions = {
    url: getMapUrl.toString(),
    coordinates: getCoordsFromBounds(bounds),
  }
  return imageSourceOptions
}

function createSource() {
  const mapObject = map.value

  const rasterSource: ImageSourceRaw = {
    type: 'image',
    ...getImageSourceOptions(props.layer),
  }
  mapObject.addSource(currentLayer, rasterSource)
  const rasterLayer: RasterLayer = {
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
  mapObject.addLayer(rasterLayer, 'boundary_country_outline')
}

function updateSource() {
  const source = map.value.getSource(currentLayer) as ImageSource
  if (props.layer === undefined || props.layer.time === undefined) return
  const cachedRequest = cachedRequests[getCacheKey(props.layer)]
  if (cachedRequest) {
    source.updateImage(cachedRequest)
    return
  }
  source.updateImage(getImageSourceOptions(props.layer))
}

function getCacheKey(layer: MapboxLayerOptions) {
  return layer.name + map.value.getBounds() + layer.time.toString()
}

function populateCache(times: Date[]) {
  if (props.layer === undefined || props.layer.time === undefined) return

  const milliSecondsInAnHour = 3.6e6
  const cacheSize = 10
  const oldTime = props.layer.time.valueOf()
  console.log('oldTime', oldTime, props.layer.time)
  const layer = { name: props.layer.name, time: new Date(props.layer.time), elevation: props.layer.elevation }
  for (let i = 1; i <= cacheSize; i++) {
    layer.time.setTime(oldTime + (i * milliSecondsInAnHour))
    const cacheKey = getCacheKey(layer)
    if (cachedRequests[cacheKey]) continue

    const imageSourceOptions = getImageSourceOptions(layer)
    console.log('imageSourceOptions', imageSourceOptions)
    // Cache by creating local blob
    if (imageSourceOptions.url === undefined) return
    fetch(imageSourceOptions.url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        cachedRequests[cacheKey] = { url: blobUrl, coordinates: imageSourceOptions.coordinates }
      })
  }
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
    if (map.value.getSource(currentLayer) !== undefined) {
      map.value.removeLayer(currentLayer)
      map.value.removeSource(currentLayer)
    }
  }
}

watch(
  () => props.layer,
  () => {
    onLayerChange()
  },
)

function onLayerChange(): void {
  if (!isInitialized) return
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

  populateCache([])

  const source = map.value.getSource(currentLayer)
  if (source === undefined) {
    createSource()
  } else {
    updateSource()
  }
}
</script>

<style scoped></style>
