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
import { type GetMapFilter, WMSProvider } from '@deltares/fews-wms-requests'
import { getFilterFromLayerOptions } from '@/lib/map'

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
}

const props = withDefaults(defineProps<Props>(), {
  enableDoubleClick: false,
  opacity: 1,
})
const isLoading = defineModel<boolean>('isLoading', { default: false })

const emit = defineEmits(['doubleclick'])

const { map } = useMap()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const wmsUrl = `${baseUrl}/wms`
const wmsProvider = new WMSProvider(wmsUrl)

const sourceOptions = ref<ImageSourceSpecification>()

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

function getImageSourceOptions(
  time = props.layer.time,
): ImageSourceSpecification | undefined {
  if (!map) return

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

  const filter: GetMapFilter = {
    ...getFilterFromLayerOptions(props.layer),
    bbox: `${getMercatorBboxFromBounds(bounds)}`,
    height: Number(`${height.toFixed(0)}`),
    width: Number(`${width.toFixed(0)}`),
    time: time?.toISOString(),
  }

  const url = wmsProvider.getMapUrl(filter)
  return {
    type: 'image',
    url: url.toString(),
    coordinates: getCoordsFromBounds(bounds),
  }
}

watch(() => props.layer, debouncedUpdate, { immediate: true })
async function updateSource() {
  if (!map || map.isMoving()) return

  sourceOptions.value = getImageSourceOptions()
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
