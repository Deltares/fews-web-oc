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
import { getLayerId, getSourceId } from '@/lib/map'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import type { Overlay } from '@/services/useOverlays'

interface Props {
  overlay: Overlay
}

const props = defineProps<Props>()

const isLoaded = inject(isLoadedSymbol)!
const { map } = useMap()
const { getBeforeId } = useLayerOrder()

// The maplibre style layer paint property that controls opacity, keyed by layer type.
const OPACITY_PROPERTY_BY_TYPE: Partial<
  Record<LayerSpecification['type'], string>
> = {
  raster: 'raster-opacity',
  fill: 'fill-opacity',
  line: 'line-opacity',
  circle: 'circle-opacity',
  'fill-extrusion': 'fill-extrusion-opacity',
  heatmap: 'heatmap-opacity',
  background: 'background-opacity',
}

const style = ref<StyleSpecification>()

const addedLayers: {
  id: string
  type: LayerSpecification['type']
  baseOpacity: number
}[] = []
const addedSourceIds: string[] = []

function namespacedSourceId(key: string): string {
  return getSourceId(`overlay-${props.overlay.id}-${key}`)
}

function namespacedLayerId(id: string): string {
  return getLayerId(`overlay-${props.overlay.id}-${id}`)
}

function removeLayers() {
  if (!map) return

  for (const layer of addedLayers) {
    if (map.getLayer(layer.id)) map.removeLayer(layer.id)
  }
  addedLayers.length = 0

  for (const sourceId of addedSourceIds) {
    if (map.getSource(sourceId)) map.removeSource(sourceId)
  }
  addedSourceIds.length = 0
}

function addLayers() {
  if (!map || !style.value) return

  removeLayers()

  const sourceIdByKey = new Map<string, string>()
  for (const [key, source] of Object.entries<SourceSpecification>(
    style.value.sources ?? {},
  )) {
    const sourceId = namespacedSourceId(key)
    sourceIdByKey.set(key, sourceId)
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, source)
      addedSourceIds.push(sourceId)
    }
  }

  const groupId = getLayerId(`overlay-${props.overlay.id}`)
  const beforeId = getBeforeId(groupId, map.getLayersOrder())

  for (const layer of style.value.layers ?? []) {
    const layerId = namespacedLayerId(layer.id)
    const newLayer = { ...layer, id: layerId } as LayerSpecification
    if ('source' in newLayer && typeof newLayer.source === 'string') {
      newLayer.source = sourceIdByKey.get(newLayer.source) ?? newLayer.source
    }

    if (!map.getLayer(layerId)) {
      map.addLayer(newLayer, beforeId)
    }

    const opacityProperty = OPACITY_PROPERTY_BY_TYPE[layer.type]
    const baseOpacity =
      opacityProperty && 'paint' in layer
        ? ((layer.paint as Record<string, unknown> | undefined)?.[
            opacityProperty
          ] as number | undefined)
        : undefined
    addedLayers.push({
      id: layerId,
      type: layer.type,
      baseOpacity: baseOpacity ?? 1,
    })
  }

  applyOpacity()
}

function applyOpacity() {
  if (!map) return

  for (const layer of addedLayers) {
    const opacityProperty = OPACITY_PROPERTY_BY_TYPE[layer.type]
    if (!opacityProperty) continue
    map.setPaintProperty(
      layer.id,
      opacityProperty,
      layer.baseOpacity * props.overlay.opacity,
    )
  }
}

const styleJsonFile = props.overlay.styleJsonFile
if (styleJsonFile) {
  const url = styleJsonFile.startsWith('http')
    ? styleJsonFile
    : getResourcesStaticUrl(styleJsonFile)
  const response = await fetch(url)
  style.value = await response.json()
}

watch([isLoaded, style], ([loaded, newStyle]) => {
  if (loaded && newStyle) addLayers()
})

watch(() => props.overlay.opacity, applyOpacity)

onScopeDispose(() => {
  removeLayers()
})
</script>
