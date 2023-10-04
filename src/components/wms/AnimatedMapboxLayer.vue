<template>
  <div />
</template>

<script setup lang="ts">
import { nextTick, onMounted, Ref, watch } from 'vue'
// @ts-ignore
import { toMercator } from '@turf/projection'
import {
  ImageSource,
  ImageSourceRaw,
  LngLatBounds,
  Map,
  RasterLayer,
} from 'mapbox-gl'
import { configManager } from '@/services/application-config'
import { useMap } from '@studiometa/vue-mapbox-gl'
import { point } from '@turf/helpers'

export interface MapboxLayerOptions {
  name: string
  time: Date
  bbox: LngLatBounds
}

interface Props {
  layer: MapboxLayerOptions | undefined
}

const props = withDefaults(defineProps<Props>(), {
  layer: undefined,
})

const { map } = useMap() as { map: Ref<Map> }

let mapObject!: Map
let newLayerId!: string
let isInitialized = false
let counter = 0
let currentLayer: string = ''

onMounted(() => {
  if (map.value.isStyleLoaded()) {
    mapObject = map.value
    addHooksToMapObject(mapObject)
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

function addHooksToMapObject(map: Map) {
  const mapObject = map
  mapObject.once('load', () => {
    isInitialized = true
    onLayerChange()
  })
  mapObject.on('moveend', () => {
    updateSource()
  })
  mapObject.on('data', async (e) => {
    if (e.sourceId === newLayerId && e.tile !== undefined && e.isSourceLoaded) {
      removeOldLayers()
      mapObject.setPaintProperty(e.sourceId, 'raster-opacity', 1)
    }
  })
}

function updateSource() {
  if (props.layer === undefined) return
  const time = props.layer.time.toISOString()
  const source = mapObject.getSource(newLayerId) as ImageSource
  const bounds = mapObject.getBounds()
  const canvas = mapObject.getCanvas()
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  source.updateImage({
    url: `${baseUrl}/wms?service=WMS&request=GetMap&version=1.3&layers=${
      props.layer.name
    }&crs=EPSG:3857&bbox=${getMercatorBboxFromBounds(bounds)}&height=${
      canvas.height
    }&width=${canvas.width}&time=${time}`,
    coordinates: getCoordsFromBounds(bounds),
  })
}

function getMercatorBboxFromBounds(bounds: LngLatBounds): number[] {
  const sw = toMercator(point(bounds.getSouthWest().toArray()))
  const ne = toMercator(point(bounds.getNorthEast().toArray()))
  return [...sw.geometry.coordinates, ...ne.geometry.coordinates]
}

function setDefaultZoom() {
  if (props.layer === undefined || props.layer.bbox === undefined) return
  if (mapObject) {
    const currentBounds = mapObject.getBounds()
    const bounds = props.layer.bbox
    if (isBoundsWithinBounds(currentBounds, bounds)) {
      return
    } else {
      nextTick(() => {
        mapObject.fitBounds(bounds)
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
  if (mapObject !== undefined) {
    const layerId = getFrameId(currentLayer, counter)
    if (mapObject.getSource(layerId) !== undefined) {
      mapObject.removeLayer(layerId)
      mapObject.removeSource(layerId)
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

  const time = props.layer.time.toISOString()
  counter += 1
  newLayerId = getFrameId(props.layer.name, counter)
  const source = mapObject.getSource(newLayerId)
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  if (currentLayer !== originalLayerName) {
    // set default zoom only if layer is changed
    setDefaultZoom()
  }

  if (source === undefined) {
    const bounds = mapObject.getBounds()
    const canvas = mapObject.getCanvas()
    const rasterSource: ImageSourceRaw = {
      type: 'image',
      url: `${baseUrl}/wms?service=WMS&request=GetMap&version=1.3&layers=${
        props.layer.name
      }&crs=EPSG:3857&bbox=${getMercatorBboxFromBounds(bounds)}&height=${
        canvas.height
      }&width=${canvas.width}&time=${time}`,
      coordinates: getCoordsFromBounds(bounds),
    }
    mapObject.addSource(newLayerId, rasterSource)
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
    mapObject.addLayer(rasterLayer, 'boundary_country_outline')
  }
}

function removeOldLayers(): void {
  for (let i = counter - 1; i > 0; i--) {
    const oldLayerId = getFrameId(currentLayer, i)
    if (mapObject.getLayer(oldLayerId)) {
      mapObject.removeLayer(oldLayerId)
      mapObject.removeSource(oldLayerId)
    } else {
      break
    }
  }
}
</script>

<style scoped></style>
