<template>
  <div></div>
</template>

<script setup lang="ts">
import { type Layer } from '@deltares/fews-wms-requests'
import {
  StreamlineStyle,
  WMSStreamlineLayer,
  type WMSStreamlineLayerOptions,
} from '@deltares/webgl-streamline-visualizer'
import { useMap } from '@/services/useMap'
import { computed, onMounted, onUnmounted, watch } from 'vue'

import { configManager } from '@/services/application-config'
import { type AnimatedRasterLayerOptions } from '@/components/wms/AnimatedRasterLayer.vue'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { getBeforeId, getLayerId } from '@/lib/map'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

type StreamlineLayerOptionsFews = Layer['animatedVectors']

interface Props {
  layerOptions?: AnimatedRasterLayerOptions
  streamlineOptions?: StreamlineLayerOptionsFews
  beforeId?: string
}
const props = defineProps<Props>()
const isLoading = defineModel<boolean>('isLoading', { default: false })
const emit = defineEmits(['doubleclick'])

const { map } = useMap()

const layerId = getLayerId('streamlines')
let layer: WMSStreamlineLayer | null = null

onMounted(() => {
  addHooksToMapObject()
  updateLayer()
})

onUnmounted(() => {
  removeLayer()
  removeHooksFromMapObject()
})

function addHooksToMapObject() {
  map?.on('load', updateLayer)
  map?.on('dblclick', onDoubleClick)
}

function removeHooksFromMapObject(): void {
  map?.off('load', updateLayer)
  map?.off('dblclick', onDoubleClick)
}

function updateLayer() {
  removeLayer()
  addLayer()
}

// Recreate the streamline visualiser when the a different layer is selected.
watch(
  () => props.layerOptions?.name,
  async () => {
    removeLayer()
    addLayer()
  },
)

// Allow only one simultaneous request to wait for layer initialisation; abort
// all requests but the last.
function addUpdateWatcher<T>(
  watchExpression: () => T,
  callback: (newValue: T) => void,
): void {
  let abortController = new AbortController()
  watch(watchExpression, async (newValue) => {
    if (!layer) return

    abortController.abort('Cancelled by new request')
    abortController = new AbortController()

    const isInitialised = await layer.waitForInitialisation(
      abortController.signal,
    )
    if (!isInitialised) return

    callback(newValue)
  })
}

// Update the velocity field when the time, elevation or color scale range is
// changed, abort all but the last change.
addUpdateWatcher(
  () => props.layerOptions?.time,
  async (time) => {
    if (!layer || !time) return
    await layer.setTime(time)
  },
)
addUpdateWatcher(
  () => props.layerOptions?.elevation,
  async (elevation) => {
    if (!layer) return
    layer.setElevation(elevation ?? null)
  },
)
addUpdateWatcher(
  () => props.layerOptions?.colorScaleRange,
  (colorScaleRange) => {
    if (!layer) return
    layer.setColorScaleRange(
      getColorScaleRangeFromString(colorScaleRange) ?? null,
    )
  },
)
addUpdateWatcher(
  () => props.layerOptions?.useDisplayUnits,
  async (useDisplayUnits) => {
    if (!layer) return
    layer.setDisplayUnits(useDisplayUnits)
  },
)

function addLayer(): void {
  if (!map) return
  if (!props.layerOptions || !props.streamlineOptions) return
  const options: WMSStreamlineLayerOptions = {
    ...mergeOptions(props.layerOptions, props.streamlineOptions),
    transformRequest: createTransformRequestFn(),
  }

  // Create and initialise new streamline layer.
  layer = new WMSStreamlineLayer(layerId, options)
  layer.on('start-loading', () => (isLoading.value = true))
  layer.on('end-loading', () => (isLoading.value = false))

  // Make sure we are at the appropriate time, elevation and color scale range
  // after the visualiser has been added to the map.
  layer.once('add', async () => {
    if (!layer || !props.layerOptions) return
    await layer.initialise(
      props.layerOptions.time,
      props.layerOptions.elevation ?? undefined,
      getColorScaleRangeFromString(props.layerOptions.colorScaleRange),
    )
  })

  const beforeId = props.beforeId ?? getBeforeId(map)
  map?.addLayer(layer, beforeId)
}

watch(
  () => props.beforeId,
  (newBeforeId) => {
    if (!map?.getLayer(layerId)) return

    const beforeId = newBeforeId ?? getBeforeId(map)
    map.moveLayer(layerId, beforeId)
  },
)

function removeLayer(): void {
  if (map !== undefined && map.style !== undefined && map.getLayer(layerId)) {
    map.removeLayer(layerId)
  }
}

function onDoubleClick(event: MapLayerMouseEvent | MapLayerTouchEvent) {
  emit('doubleclick', event)
}

function mergeOptions(
  layerOptions: AnimatedRasterLayerOptions,
  streamlineOptions: StreamlineLayerOptionsFews,
): WMSStreamlineLayerOptions {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const baseUrlWms = `${baseUrl}/wms`
  return {
    baseUrl: baseUrlWms,
    layer: layerOptions.name,
    useDisplayUnits: layerOptions.useDisplayUnits,
    streamlineStyle: streamlineOptions?.coloredParticles
      ? StreamlineStyle.MagnitudeColoredParticles
      : StreamlineStyle.ColoredParticles,
    numParticles: streamlineOptions?.numberOfParticles ?? 1000,
    particleSize: streamlineOptions?.particleSize ?? 3,
    speedFactor: streamlineOptions?.speedFactor ?? 0.2,
    fadeAmountPerSecond: streamlineOptions?.fadeAmount ?? 0.1,
    speedExponent: streamlineOptions?.speedExponent ?? 1,
    particleColor: streamlineOptions?.particleColor
      ? `#${streamlineOptions?.particleColor}`
      : undefined,
  }
}

function getColorScaleRangeFromString(
  colorScaleRangeString?: string,
): [number, number] | undefined {
  if (!colorScaleRangeString) return undefined
  return colorScaleRangeString.split(',', 2).map(parseFloat) as [number, number]
}
</script>
