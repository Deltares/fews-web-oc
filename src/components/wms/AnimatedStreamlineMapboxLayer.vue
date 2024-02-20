<template>
  <div></div>
</template>

<script setup lang="ts">
import { type Layer } from '@deltares/fews-wms-requests'
import { useMap } from '@studiometa/vue-mapbox-gl'
import { onMounted, onUnmounted, watch } from 'vue'

import {
  StreamlineStyle,
  WMSStreamlineLayer,
  type WMSStreamlineLayerOptions,
} from '@/lib/streamlines'
import { configManager } from '@/services/application-config'
import { type MapboxLayerOptions } from './AnimatedMapboxLayer.vue'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'mapbox-gl'

type StreamlineLayerOptionsFews = Layer['animatedVectors']

interface Props {
  layerOptions?: MapboxLayerOptions
  streamlineOptions?: StreamlineLayerOptionsFews
}
const props = defineProps<Props>()
const emit = defineEmits(['doubleclick'])

const { map } = useMap()

const layerId = 'streamlines'
let layer: WMSStreamlineLayer | null = null

onMounted(addLayer)
onUnmounted(removeLayer)

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
function addUpdateWatcher(
  watchExpression: () => unknown,
  callback: (newValue: unknown) => void,
): void {
  let abortController = new AbortController()
  watch(watchExpression, async (newValue) => {
    if (!layer) return

    abortController.abort()
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
    await layer.setTime(time as Date)
  },
)
addUpdateWatcher(
  () => props.layerOptions?.elevation,
  async (elevation) => {
    if (!layer) return
    layer.setElevation((elevation as number | undefined) ?? null)
  },
)
addUpdateWatcher(
  () => props.layerOptions?.colorScaleRange,
  (colorScaleRange) => {
    if (!layer) return
    layer.setColorScaleRange(
      getColorScaleRangeFromString(colorScaleRange as string) ?? null,
    )
  },
)

function addLayer(): void {
  if (!props.layerOptions || !props.streamlineOptions) return
  const options = mergeOptions(props.layerOptions, props.streamlineOptions)

  // Create and initialise new streamline layer.
  layer = new WMSStreamlineLayer(layerId, options)
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

  map.value.addLayer(layer, 'boundary_country_outline')
  map.value.on('dblclick', onDoubleClick)
}

function removeLayer(): void {
  map.value.removeLayer(layerId)
  map.value.off('dblclick', onDoubleClick)
}

function onDoubleClick(event: MapLayerMouseEvent | MapLayerTouchEvent) {
  emit('doubleclick', event)
}

function mergeOptions(
  layerOptions: MapboxLayerOptions,
  streamlineOptions: StreamlineLayerOptionsFews,
): WMSStreamlineLayerOptions {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const baseUrlWms = `${baseUrl}/wms`
  return {
    baseUrl: baseUrlWms,
    layer: layerOptions.name,
    streamlineStyle: StreamlineStyle.ColoredParticles,
    numParticles: streamlineOptions?.numberOfParticles ?? 1000,
    particleSize: streamlineOptions?.particleSize ?? 3,
    speedFactor: streamlineOptions?.speedFactor ?? 0.2,
    fadeAmountPerSecond: streamlineOptions?.fadeAmount ?? 0.1,
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
