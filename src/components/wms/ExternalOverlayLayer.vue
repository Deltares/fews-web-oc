<template></template>

<script setup lang="ts">
import { inject, onScopeDispose, ref, watch } from 'vue'
import type {
  LayerSpecification,
  SourceSpecification,
  StyleSpecification,
} from 'maplibre-gl'
import { isLoadedSymbol } from '@indoorequal/vue-maplibre-gl'
import { useMap } from '@/services/useMap'
import { useLayerOrder } from '@/services/useLayerOrder'
import { getLayerId, getSourceId, getSubLayerId } from '@/lib/map'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import type { Overlay } from '@/services/useOverlays'

interface Props {
  overlay: Overlay
}

const props = defineProps<Props>()

const isLoaded = inject(isLoadedSymbol)!
const { map } = useMap()
const { getBeforeId } = useLayerOrder()

type OpacityProperty =
  | 'raster-opacity'
  | 'fill-opacity'
  | 'line-opacity'
  | 'circle-opacity'
  | 'fill-extrusion-opacity'
  | 'heatmap-opacity'
  | 'background-opacity'

// The maplibre style layer paint property that controls opacity, keyed by layer type.
const OPACITY_PROPERTY_BY_TYPE: Partial<
  Record<LayerSpecification['type'], OpacityProperty>
> = {
  raster: 'raster-opacity',
  fill: 'fill-opacity',
  line: 'line-opacity',
  circle: 'circle-opacity',
  'fill-extrusion': 'fill-extrusion-opacity',
  heatmap: 'heatmap-opacity',
  background: 'background-opacity',
}

interface OpacityLayer {
  id: string
  opacityProperty: OpacityProperty
  baseOpacity: number
}

const style = ref<StyleSpecification>()

// All map layers of this overlay are sub layers of one layer group, so that
// they are ordered as a single layer (see useLayerOrder).
const groupLayerId = getLayerId(`overlay-${props.overlay.id}`)
const groupSourceId = getSourceId(`overlay-${props.overlay.id}`)

const opacityLayers: OpacityLayer[] = []
const addedSourceIds: string[] = []

function isOwnLayer(layerId: string): boolean {
  return layerId.startsWith(getSubLayerId(groupLayerId, ''))
}

function removeLayers() {
  if (!map?.style) return

  // Also removes layers that were carried over from a previous map style.
  for (const layerId of map.getLayersOrder()) {
    if (isOwnLayer(layerId)) map.removeLayer(layerId)
  }
  opacityLayers.length = 0

  for (const sourceId of addedSourceIds) {
    if (map.getSource(sourceId)) map.removeSource(sourceId)
  }
  addedSourceIds.length = 0
}

function getBaseOpacity(
  layer: LayerSpecification,
  opacityProperty: OpacityProperty,
): number | undefined {
  if (!('paint' in layer) || !layer.paint) return 1
  const value = (layer.paint as Record<string, unknown>)[opacityProperty]
  if (value === undefined) return 1
  // Opacity expressions cannot be scaled, so they are left untouched.
  return typeof value === 'number' ? value : undefined
}

function addLayers() {
  if (!map || !style.value) return

  removeLayers()

  const sourceIdByKey = new Map<string, string>()
  for (const [key, source] of Object.entries<SourceSpecification>(
    style.value.sources ?? {},
  )) {
    const sourceId = getSubLayerId(groupSourceId, key)
    sourceIdByKey.set(key, sourceId)
    if (!map.getSource(sourceId)) map.addSource(sourceId, source)
    addedSourceIds.push(sourceId)
  }

  const beforeId = getBeforeId(groupLayerId, map.getLayersOrder())

  for (const layer of style.value.layers ?? []) {
    const layerId = getSubLayerId(groupLayerId, layer.id)
    const newLayer = { ...layer, id: layerId } as LayerSpecification
    if ('source' in newLayer && typeof newLayer.source === 'string') {
      newLayer.source = sourceIdByKey.get(newLayer.source) ?? newLayer.source
    }

    map.addLayer(newLayer, beforeId)

    const opacityProperty = OPACITY_PROPERTY_BY_TYPE[layer.type]
    if (!opacityProperty) continue
    const baseOpacity = getBaseOpacity(layer, opacityProperty)
    if (baseOpacity === undefined) continue
    opacityLayers.push({ id: layerId, opacityProperty, baseOpacity })
  }

  applyOpacity()
}

function applyOpacity() {
  if (!map) return

  for (const layer of opacityLayers) {
    if (!map.getLayer(layer.id)) continue
    map.setPaintProperty(
      layer.id,
      layer.opacityProperty,
      layer.baseOpacity * props.overlay.opacity,
    )
  }
}

async function fetchStyle(
  styleJsonFile: string,
): Promise<StyleSpecification | undefined> {
  const isExternal =
    styleJsonFile.startsWith('http://') || styleJsonFile.startsWith('https://')
  try {
    let request = new Request(
      isExternal ? styleJsonFile : getResourcesStaticUrl(styleJsonFile),
    )
    // Only add authentication headers to requests to the FEWS web services.
    if (!isExternal) request = await createTransformRequestFn()(request)
    const response = await fetch(request)
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(
      `Failed to load style "${styleJsonFile}" of overlay "${props.overlay.id}":`,
      error,
    )
  }
}

if (props.overlay.styleJsonFile) {
  style.value = await fetchStyle(props.overlay.styleJsonFile)
}

// The style has been loaded at this point and the map may be loaded as well
// (e.g. when the overlay is made visible again), so this must run immediately.
watch(
  [isLoaded, style],
  ([loaded, newStyle]) => {
    if (loaded && newStyle) addLayers()
  },
  { immediate: true },
)

watch(() => props.overlay.opacity, applyOpacity)

onScopeDispose(() => {
  removeLayers()
})
</script>
