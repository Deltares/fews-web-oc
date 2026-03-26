import type { BaseMap } from '@/lib/basemap'
import { getLayerId, isCustomLayer, mapIds } from '@/lib/map'
import type { Overlay } from '@deltares/fews-pi-requests'
import type { Map } from 'maplibre-gl'
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
  const layerOrder = computed(() => {
    const _layers = toValue(layers)
    const _baseMap = toValue(baseMap)

    const layerIds = _layers.map(convertOverlayToLayerId)
    const order = ensureExactlyOneWmsLayer(layerIds)

    return _baseMap.beforeId ? [...order, _baseMap.beforeId] : order
  })

  provide(LAYER_ORDER_KEY, layerOrder)
}

export function useLayerOrder() {
  const layerOrder = inject(LAYER_ORDER_KEY, undefined)

  if (!layerOrder) {
    throw new Error('Layer order is not provided')
  }

  function getBeforeId(layerId: string, map: Map): string | undefined {
    const _layerOrder = toValue(layerOrder)
    if (!_layerOrder) {
      console.warn('Layer order is not provided')
    }

    const desiredOrder = _layerOrder ?? []
    const currentOrder = map.getLayersOrder()

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

function ensureExactlyOneWmsLayer(layerIds: string[]) {
  const wmsLayerCount = layerIds.filter((id) => id === mapIds.wms.layer).length

  if (wmsLayerCount === 0) {
    // If there is no WMS layer, we add it at the beginning of the layer order
    return [mapIds.wms.layer, ...layerIds]
  }

  if (wmsLayerCount > 1) {
    throw new Error(
      `There should be exactly one layer with id ${mapIds.wms.layer} in the layer order.`,
    )
  }

  return layerIds
}
