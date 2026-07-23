<template></template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { toMercator } from '@turf/projection'
import {
  Coordinates,
  ImageSourceSpecification,
  LngLat,
  LngLatBounds,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
  type MapSourceDataEvent,
} from 'maplibre-gl'
import { configManager } from '@/services/application-config'
import { useMap } from '@/services/useMap'
import { point } from '@turf/helpers'
import { debounce } from 'lodash-es'
import { useLayer, useSource } from '@/services/useLayer'

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
  opacity?: number
  sourceId: string
  enableDoubleClick?: boolean
  showSnapshotFrames?: boolean
  snapshotTimes?: Date[]
}

const props = withDefaults(defineProps<Props>(), {
  enableDoubleClick: false,
  opacity: 1,
  showSnapshotFrames: false,
  snapshotTimes: () => [],
})
const isLoading = defineModel<boolean>('isLoading', { default: false })

const emit = defineEmits(['doubleclick'])

const { map } = useMap()

const sourceOptions = ref<ImageSourceSpecification>()
const SNAPSHOT_LAYER_OPACITY_SCALE = 0.2

onMounted(() => {
  isLoading.value = true
  addHooksToMapObject()
})

onUnmounted(() => {
  isLoading.value = false
  removeHooksFromMapObject()
  clearSnapshotLayers()
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
    map?.setPaintProperty(props.layerId, 'raster-opacity', props.opacity)
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

function getImageSourceOptions(time = props.layer.time):
  | ImageSourceSpecification
  | undefined {
  if (!map) return

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
  if (time) {
    getMapUrl.searchParams.append('time', time.toISOString())
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
    type: 'image',
    url: getMapUrl.toString(),
    coordinates: getCoordsFromBounds(bounds),
  }
}

function getImageSourceOptionsAtTime(
  time: Date,
): ImageSourceSpecification | undefined {
  return getImageSourceOptions(time)
}

watch(() => props.layer, debouncedUpdate, { immediate: true })
async function updateSource() {
  if (!map || map.isMoving()) return

  sourceOptions.value = getImageSourceOptions()
  syncSnapshotLayers()
}

watch(
  [() => props.showSnapshotFrames, () => props.snapshotTimes, () => props.opacity],
  () => {
    syncSnapshotLayers()
  },
  { deep: true },
)

function getSnapshotSourceId(index: number): string {
  return `${props.sourceId}-snapshot-${index}`
}

function getSnapshotLayerId(index: number): string {
  return `${props.layerId}-snapshot-${index}`
}

function clearSnapshotLayers(): void {
  if (!map) return

  for (let index = 0; index < 8; index++) {
    const layerId = getSnapshotLayerId(index)
    const sourceId = getSnapshotSourceId(index)

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId)
    }
  }
}

function syncSnapshotLayers(): void {
  if (!map) return
  clearSnapshotLayers()

  if (!props.showSnapshotFrames) return
  if (!props.snapshotTimes.length) return

  props.snapshotTimes.forEach((time, index) => {
    const sourceOptionsForTime = getImageSourceOptionsAtTime(time)
    if (!sourceOptionsForTime) return

    const sourceId = getSnapshotSourceId(index)
    const layerId = getSnapshotLayerId(index)

    map.addSource(sourceId, sourceOptionsForTime)

    const maxOpacity = (props.opacity ?? 1) * SNAPSHOT_LAYER_OPACITY_SCALE
    const opacityStep = maxOpacity / (props.snapshotTimes.length + 1)
    const opacity = Math.max(maxOpacity - opacityStep * index, 0.05)
    const beforeLayerId = map.getLayer(props.layerId) ? props.layerId : undefined

    map.addLayer(
      {
        type: 'raster',
        id: layerId,
        source: sourceId,
        paint: {
          'raster-opacity': opacity,
          'raster-fade-duration': 0,
        },
      },
      beforeLayerId,
    )
  })
}

const { source } = useSource(props.sourceId, sourceOptions)
useLayer(
  props.layerId,
  () => ({
    type: 'raster',
    id: props.layerId,
    source: props.sourceId,
    paint: {
      'raster-opacity': props.opacity ?? 1,
      'raster-fade-duration': 0,
    },
  }),
  source,
)

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
