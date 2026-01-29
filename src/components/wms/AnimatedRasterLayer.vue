<template>
  <mgl-image-source
    v-if="sourceOptions"
    :sourceId="sourceId"
    :url="sourceOptions.url"
    :coordinates="sourceOptions.coordinates"
  >
    <mgl-raster-layer
      :layerId="layerId"
      :before="beforeId"
      :key="beforeId"
      :paint="{
        'raster-opacity': 0,
        'raster-fade-duration': 0,
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
import { getBeforeId } from '@/lib/map'
import { debounce } from 'lodash-es'

export interface AnimatedRasterLayerOptions {
  name: string
  time?: Date
  aggregationLabel?: string
  useDisplayUnits?: boolean
  bbox?: LngLatBounds
  elevation?: number | null
  colorScaleRange?: string
  style?: string
  useLastValue?: boolean
  layerType?: string
  taskRunId?: string
}

interface Props {
  layer: AnimatedRasterLayerOptions
  layerId: string
  sourceId: string
  beforeId?: string
  enableDoubleClick?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableDoubleClick: false,
})
const isLoading = defineModel<boolean>('isLoading', { default: false })

const beforeId = computed(() => getBeforeId(map, props.layerId, props.beforeId))

const emit = defineEmits(['doubleclick'])

const { map } = useMap()

const sourceOptions = ref<ReturnType<typeof getImageSourceOptions>>()

onMounted(() => {
  isLoading.value = true
  addHooksToMapObject()
})

onUnmounted(() => {
  isLoading.value = false
  removeHooksFromMapObject()
})

watch(
  () => props.enableDoubleClick,
  () => {
    removeHooksFromMapObject()
    addHooksToMapObject()
  },
)

const debouncedUpdate = debounce(updateSource, 100)

function onMapMoveStart(): void {
  debouncedUpdate.cancel()
}

function onMapMoveEnd(): void {
  debouncedUpdate()
}

function onDataChange(event: MapSourceDataEvent): void {
  if (
    event.sourceId === props.sourceId &&
    event.tile !== undefined &&
    event.isSourceLoaded
  ) {
    map?.setPaintProperty(props.layerId, 'raster-opacity', 1)
  }
}

function onDoubleClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('doubleclick', event)
}

function onStartLoading(e: MapSourceDataEvent): void {
  if (e.sourceId === props.sourceId) {
    isLoading.value = true
  }
}

function onEndLoading(e: MapSourceDataEvent): void {
  if (e.isSourceLoaded && e.sourceId === props.sourceId) {
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
  map?.on('movestart', onMapMoveStart)
  map?.on('moveend', onMapMoveEnd)
  map?.on('sourcedata', onDataChange)
  if (props.enableDoubleClick) {
    map?.on('dblclick', onDoubleClick)
  }
  map?.on('dataloading', onStartLoading)
  map?.on('sourcedata', onEndLoading)
  map?.on('error', onError)
}

function removeHooksFromMapObject(): void {
  map?.off('movestart', onMapMoveStart)
  map?.off('moveend', onMapMoveEnd)
  map?.off('sourcedata', onDataChange)
  map?.off('dblclick', onDoubleClick)
  map?.off('dataloading', onStartLoading)
  map?.off('sourcedata', onEndLoading)
  map?.off('error', onError)
}

function getImageSourceOptions() {
  if (map === undefined) {
    return
  }

  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
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
  if (props.layer.time) {
    getMapUrl.searchParams.append('time', props.layer.time.toISOString())
  }
  if (props.layer.aggregationLabel) {
    getMapUrl.searchParams.append('aggregation', props.layer.aggregationLabel)
  }
  if (props.layer.useLastValue) {
    getMapUrl.searchParams.append('useLastValue', 'true')
  }
  if (props.layer.style) {
    getMapUrl.searchParams.append('styles', props.layer.style)
  }
  if (props.layer.elevation) {
    getMapUrl.searchParams.append('elevation', `${props.layer.elevation}`)
  }
  if (props.layer.layerType) {
    getMapUrl.searchParams.append('layerType', props.layer.layerType)
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
  if (props.layer.taskRunId) {
    getMapUrl.searchParams.append('taskRunId', props.layer.taskRunId)
  }
  return {
    url: getMapUrl.toString(),
    coordinates: getCoordsFromBounds(bounds),
  }
}

watch(() => props.layer, debouncedUpdate, { immediate: true })
async function updateSource() {
  if (!map || map.isMoving()) return

  if (!sourceOptions.value) {
    sourceOptions.value = getImageSourceOptions()
    return
  }

  const source = map.getSource(props.sourceId) as ImageSource
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
