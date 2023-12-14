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

let isInitialized = false
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
    if (
      e.sourceId === currentLayer &&
      e.tile !== undefined &&
      e.isSourceLoaded
    ) {
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

function createSource() {
  const mapObject = map.value

  const rasterSource: ImageSourceRaw = {
    type: 'image',
    ...getImageSourceOptions(),
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
function createCoastline() {
  const mapObject = map.value
  mapObject.addSource('coastline_outline', {
    type: 'vector',
    url: 'mapbox://mapbox.mapbox-streets-v8',
  })
  mapObject.addLayer(
    {
      id: 'coastline_outline',
      type: 'line',
      source: 'coastline_outline',
      'source-layer': 'water',
      layout: {},
      paint: {
        'line-color': '#fff', // Main line color
        'line-width': 3, // Main line width
        'line-opacity': 0.5, // Main line opacity
      },
    },
    'boundary_country_outline',
  )
  mapObject.addLayer(
    {
      id: 'coastline_outline2',
      type: 'line',
      source: 'coastline_outline',
      'source-layer': 'water',
      layout: {},
      paint: {
        'line-color': '#000', // Main line color
        'line-width': 1, // Main line width
        'line-opacity': 0.5, // Main line opacity
      },
    },
    'boundary_country_outline',
  )
}

function removeCoastline() {
  const mapObject = map.value
  if (mapObject.getLayer('coastline_outline') !== undefined) {
    mapObject.removeLayer('coastline_outline')
  }
  if (mapObject.getLayer('coastline_outline2') !== undefined) {
    mapObject.removeLayer('coastline_outline2')
  }
  if (mapObject.getSource('coastline_outline') !== undefined) {
    mapObject.removeSource('coastline_outline')
  }
}
function updateSource() {
  const source = map.value.getSource(currentLayer) as ImageSource
  if (source !== undefined) source.updateImage(getImageSourceOptions())
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
  if (props.layer === undefined) return
  if (props.layer === null) {
    removeLayer()
    removeCoastline()
    return
  }
  if (props.layer.name === undefined || props.layer.time === undefined) {
    return
  }

  if (props.layer.name !== currentLayer) {
    removeLayer()
    removeCoastline()
    currentLayer = props.layer.name
    setDefaultZoom()
  }

  const source = map.value.getSource(currentLayer)
  if (source === undefined) {
    createSource()
    createCoastline()
  } else {
    updateSource()
  }
}
</script>

<style scoped></style>
