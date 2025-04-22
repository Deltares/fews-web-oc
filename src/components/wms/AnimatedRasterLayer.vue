<template>
  <mgl-image-source
    :sourceId="sourceId"
    :url="sourceOptions?.url"
    :coordinates="sourceOptions?.coordinates"
  >
    <mgl-raster-layer
      :layerId="layerId"
      :before="beforeId"
      :key="beforeId"
      :paint="{
        'raster-opacity': 0,
        'raster-fade-duration': 0,
        'raster-opacity-transition': { duration: 0, delay: 0 },
      }"
    />
  </mgl-image-source>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { toMercator } from '@turf/projection'
import {
  Coordinates,
  ImageSource,
  LngLat,
  LngLatBounds,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  type MapSourceDataEvent,
} from 'maplibre-gl'
import { MglImageSource, MglRasterLayer } from '@indoorequal/vue-maplibre-gl'
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
  layer: AnimatedRasterLayerOptions
  beforeId?: string
}

const props = withDefaults(defineProps<Props>(), {})
const isLoading = defineModel<boolean>('isLoading', { default: false })

const beforeId = computed(() => {
  return props.beforeId ?? getBeforeId(map)
})

const sourceId = computed(() => getSourceId(`${props.layer.name}-source`))
const layerId = computed(() => getLayerId(`${props.layer.name}-layer`))

const emit = defineEmits(['doubleclick'])

const { map } = useMap()

const sourceOptions = ref(getImageSourceOptions())

onMounted(() => {
  isLoading.value = true
  addHooksToMapObject()
})

onUnmounted(() => {
  isLoading.value = false
  removeHooksFromMapObject()
})

function onMapMove(): void {
  updateSource()
}

function onDataChange(event: MapSourceDataEvent): void {
  if (
    event.sourceId === sourceId.value &&
    event.tile !== undefined &&
    event.isSourceLoaded
  ) {
    map?.setPaintProperty(layerId.value, 'raster-opacity', 1)
  }
}

function onDoubleClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('doubleclick', event)
}

function onStartLoading(e: MapSourceDataEvent): void {
  if (e.sourceId === sourceId.value) {
    isLoading.value = true
  }
}

function onEndLoading(e: MapSourceDataEvent): void {
  if (e.isSourceLoaded && e.sourceId === sourceId.value) {
    isLoading.value = false
  }
}

function onError(e: ErrorEvent) {
  // NOTE: All maplibre errors are printed to the console
  //       if no error event listener is added. Abort errors
  //       happen mostly when the user moves the map before
  //       the image is loaded. This is almost never an error.
  if (e.error.name === 'AbortError' || e.error.message.includes('aborted')) {
    return
  }
  console.error(e)
}

function addHooksToMapObject() {
  map?.on('moveend', onMapMove)
  map?.on('sourcedata', onDataChange)
  map?.on('dblclick', onDoubleClick)
  map?.on('dataloading', onStartLoading)
  map?.on('sourcedata', onEndLoading)
  map?.on('error', onError)
}

function removeHooksFromMapObject(): void {
  map?.off('moveend', onMapMove)
  map?.off('sourcedata', onDataChange)
  map?.off('dblclick', onDoubleClick)
  map?.off('dataloading', onStartLoading)
  map?.off('sourcedata', onEndLoading)
  map?.off('error', onError)
}

function getImageSourceOptions() {
  if (props.layer.time === undefined || map === undefined) {
    return
  }

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
  return {
    url: getMapUrl.toString(),
    coordinates: getCoordsFromBounds(bounds),
  }
}

watch(() => props.layer, updateSource)
function updateSource() {
  const source = map?.getSource(sourceId.value) as ImageSource
  if (!source) return

  const imageOptions = getImageSourceOptions()
  if (!imageOptions) return

  source.updateImage(imageOptions)
}

function getMercatorBboxFromBounds(bounds: LngLatBounds): number[] {
  const sw = toMercator(point(bounds.getSouthWest().toArray()))
  const ne = toMercator(point(bounds.getNorthEast().toArray()))
  return [...sw.geometry.coordinates, ...ne.geometry.coordinates]
}

function getCoordsFromBounds(bounds: LngLatBounds): Coordinates {
  return [
    bounds.getNorthWest().toArray(),
    bounds.getNorthEast().toArray(),
    bounds.getSouthEast().toArray(),
    bounds.getSouthWest().toArray(),
  ]
}
</script>
