import type { BaseMap } from '@/lib/basemap'
import { getLayerId, isCustomLayer, mapIds } from '@/lib/map'
import type { Overlay } from '@/services/useOverlays'
import {
  computed,
  type ComputedRef,
  inject,
  type InjectionKey,
  type MaybeRefOrGetter,
  provide,
  toValue,
} from 'vue'

const LAYER_ORDER_KEY: InjectionKey<ComputedRef<string[]>> =
  Symbol('LayerOrder')

export function provideLayerOrder(
  layers: MaybeRefOrGetter<Overlay[]>,
  baseMap: MaybeRefOrGetter<BaseMap>,
) {
  // This computed property defines the desired relative layer order for a subset of layers
  // (e.g. custom layers, base map layer) in the map style.
  const layerOrder = computed(() => {
    const _layers = toValue(layers)
    const _baseMap = toValue(baseMap)

    const layerIds = _layers.map(convertOverlayToLayerId)
    const layerIdsWithBeforeId = _baseMap.beforeId
      ? [...layerIds, _baseMap.beforeId]
      : layerIds

    // From bottom to top (i.e. the last layer is rendered on top of all the previous layers)
    return [
      ...layerIdsWithBeforeId,
      mapIds.location.layer.fill,
      mapIds.location.layer.circle,
      mapIds.location.layer.childSymbol,
      mapIds.location.layer.symbol,
      mapIds.location.layer.text,
      mapIds.coordinate.layer,
    ]
  })

  provide(LAYER_ORDER_KEY, layerOrder)
}

export function useLayerOrder() {
  const layerOrder = inject(LAYER_ORDER_KEY, undefined)

  if (!layerOrder) {
    throw new Error('Layer order is not provided')
  }

  function getBeforeId(
    layerId: string,
    currentOrder: string[],
  ): string | undefined {
    const _layerOrder = toValue(layerOrder)
    if (!_layerOrder) {
      console.warn('Layer order is not provided')
    }

    const desiredOrder = _layerOrder ?? []

    // Find the index of the target layer in the desired order
    const desiredIdx = desiredOrder.indexOf(layerId)

    if (desiredIdx !== -1) {
      // Look for the next layer (after layerId) in layerOrder that exists in currentOrder
      const nextInOrder = desiredOrder
        .slice(desiredIdx + 1)
        .find((id) => currentOrder.includes(id))
      if (nextInOrder) return nextInOrder
    }

    // If not found, return the first custom layer in currentOrder that is not layerId and not in layerOrder
    return currentOrder.find(
      (id) => isCustomLayer(id) && id !== layerId && !desiredOrder.includes(id),
    )
  }

  return { layerOrder, getBeforeId }
}

function convertOverlayToLayerId(overlay: Overlay): string {
  if (overlay.type === 'gridLayer') {
    return mapIds.wms.layer
  }

  if (overlay.type === 'overLay') {
    return getLayerId(`overlay-${overlay.id}`)
  }

  throw new Error(`Unknown layer type: ${overlay.type}`)
}
