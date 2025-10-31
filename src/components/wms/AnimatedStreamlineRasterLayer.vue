<template>
  <div></div>
</template>

<script setup lang="ts">
import { type Layer } from '@deltares/fews-wms-requests'
import {
  StreamlineStyle,
  WMSStreamlineLayer,
  type WMSStreamlineLayerOptions,
  TrailParticleShape,
} from '@deltares/webgl-streamline-visualizer'
import { useMap } from '@/services/useMap'
import { inject, onMounted, onUnmounted, watch } from 'vue'

import { configManager } from '@/services/application-config'
import { type AnimatedRasterLayerOptions } from '@/components/wms/AnimatedRasterLayer.vue'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { getBeforeId } from '@/lib/map'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { isLoadedSymbol } from '@indoorequal/vue-maplibre-gl'

type StreamlineLayerOptionsFews = Layer['animatedVectors']

const DEFAULT_STREAMLINE_OPTIONS = {
  defaultNumParticles: 1000,
  defaultParticleSize: 3,
  defaultSpeedFactor: 0.2,
  defaultFadeAmountPerSecond: 0.1,
  defaultSpeedExponent: 1,
  defaultMaxAge: 2,
  defaultGrowthRate: undefined,
  trailParticleOptions: undefined,
}

const DEFAULT_WAVECREST_OPTIONS = {
  defaultNumParticles: 1000,
  defaultParticleSize: 12,
  defaultSpeedFactor: 0.02,
  defaultFadeAmountPerSecond: 3,
  defaultSpeedExponent: 1,
  defaultMaxAge: 10,
  defaultGrowthRate: 1,
  trailParticleOptions: {
    shape: TrailParticleShape.Rectangle,
    aspectRatio: 10,
    doRotate: true,
  },
}

interface Props {
  layerOptions?: AnimatedRasterLayerOptions
  streamlineOptions?: StreamlineLayerOptionsFews
  layerId: string
  beforeId?: string
  enableDoubleClick: boolean
}
const props = withDefaults(defineProps<Props>(), {
  enableDoubleClick: false,
})
const isLoading = defineModel<boolean>('isLoading', { default: false })
const emit = defineEmits(['doubleclick'])

const { map } = useMap()

let layer: WMSStreamlineLayer | null = null

onMounted(() => {
  addHooksToMapObject()
})

onUnmounted(() => {
  removeLayer()
  removeHooksFromMapObject()
})

watch(
  () => props.enableDoubleClick,
  () => {
    removeHooksFromMapObject()
    addHooksToMapObject()
  },
)

function addHooksToMapObject() {
  if (props.enableDoubleClick) {
    map?.on('dblclick', onDoubleClick)
  }
}

function removeHooksFromMapObject(): void {
  map?.off('dblclick', onDoubleClick)
}

const isLoaded = inject(isLoadedSymbol)!

watch(
  [isLoaded, () => props.layerOptions?.name],
  ([loaded]) => {
    if (loaded) {
      updateLayer()
    }
  },
  { immediate: true },
)

function updateLayer() {
  removeLayer()
  addLayer()
}

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
  (elevation) => {
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
  (useDisplayUnits) => {
    if (!layer) return
    layer.setDisplayUnits(useDisplayUnits)
  },
)
addUpdateWatcher(
  () => props.layerOptions?.style,
  (style) => {
    if (!layer || !style) return
    layer.setStyle(style)
  },
)
addUpdateWatcher(
  () => props.layerOptions?.useLastValue,
  (useLastValue) => {
    if (!layer) return
    layer.setUseLastValue(useLastValue ?? false)
  },
)

function addLayer(): void {
  if (!map) return
  if (!props.layerOptions || !props.streamlineOptions) return
  const options: WMSStreamlineLayerOptions = {
    ...mergeOptions(props.layerOptions, props.streamlineOptions),
    transformRequest: createTransformRequestFn(),
    downsampleFactorWMS: 2,
  }

  // Create and initialise new streamline layer.
  layer = new WMSStreamlineLayer(props.layerId, options)
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

  const beforeId = getBeforeId(map, props.layerId, props.beforeId)
  map?.addLayer(layer, beforeId)
}

watch(
  () => props.beforeId,
  (newBeforeId) => {
    if (!map?.getLayer(props.layerId)) return

    const beforeId = getBeforeId(map, props.layerId, newBeforeId)
    map.moveLayer(props.layerId, beforeId)
  },
)

function removeLayer(): void {
  if (
    map !== undefined &&
    map.style !== undefined &&
    map.getLayer(props.layerId)
  ) {
    map.removeLayer(props.layerId)
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

  const isWaveCrest = streamlineOptions?.particleType === 'wave-crest'

  const {
    defaultNumParticles,
    defaultParticleSize,
    defaultSpeedFactor,
    defaultFadeAmountPerSecond,
    defaultSpeedExponent,
    defaultMaxAge,
    defaultGrowthRate,
    trailParticleOptions,
  } = isWaveCrest ? DEFAULT_WAVECREST_OPTIONS : DEFAULT_STREAMLINE_OPTIONS

  return {
    baseUrl: baseUrlWms,
    layer: layerOptions.name,
    style: layerOptions.style,
    useDisplayUnits: layerOptions.useDisplayUnits,
    streamlineStyle: streamlineOptions?.coloredParticles
      ? StreamlineStyle.MagnitudeColoredParticles
      : StreamlineStyle.ColoredParticles,
    numParticles: streamlineOptions?.numberOfParticles ?? defaultNumParticles,
    particleSize: streamlineOptions?.particleSize ?? defaultParticleSize,
    speedFactor: streamlineOptions?.speedFactor ?? defaultSpeedFactor,
    fadeAmountPerSecond:
      streamlineOptions?.fadeAmount ?? defaultFadeAmountPerSecond,
    speedExponent: streamlineOptions?.speedExponent ?? defaultSpeedExponent,
    particleColor: streamlineOptions?.particleColor
      ? `#${streamlineOptions?.particleColor}`
      : undefined,
    maxAge: streamlineOptions?.maximumParticleAge ?? defaultMaxAge,
    growthRate: defaultGrowthRate,
    trailParticleOptions,
  }
}

function getColorScaleRangeFromString(
  colorScaleRangeString?: string,
): [number, number] | undefined {
  if (!colorScaleRangeString) return undefined
  return colorScaleRangeString.split(',', 2).map(parseFloat) as [number, number]
}
</script>
