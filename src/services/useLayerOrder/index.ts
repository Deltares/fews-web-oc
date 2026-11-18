import type { BaseMap } from '@/lib/basemap'
import { getLayerGroupId, getLayerId, isCustomLayer, mapIds } from '@/lib/map'
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

    // Layers that are part of a group (e.g. the sub layers of an external
    // overlay) are ordered as a whole, using the id of their group.
    const groupId = getLayerGroupId(layerId)

    // Find the index of the target layer in the desired order
    const desiredIdx = desiredOrder.indexOf(groupId)

    if (desiredIdx !== -1) {
      // Look for the next layer (after layerId) in layerOrder that exists in
      // currentOrder, and return the bottom-most map layer of it
      for (const nextId of desiredOrder.slice(desiredIdx + 1)) {
        const nextInOrder = currentOrder.find(
          (id) => getLayerGroupId(id) === nextId,
        )
        if (nextInOrder) return nextInOrder
      }
    }

    // If not found, return the first custom layer in currentOrder that is not
    // part of the layerId group and not in layerOrder
    return currentOrder.find((id) => {
      if (!isCustomLayer(id)) return false
      const idGroupId = getLayerGroupId(id)
      return idGroupId !== groupId && !desiredOrder.includes(idGroupId)
    })
  }

  return { layerOrder, getBeforeId }
}

function convertOverlayToLayerId(overlay: Overlay): string {
  if (overlay.type === 'gridLayer') {
    return mapIds.wms.layer
  }

  if (overlay.type === 'overLay' || overlay.type === 'externalOverLay') {
    return getLayerId(`overlay-${overlay.id}`)
  }

  throw new Error(`Unknown layer type: ${overlay.type}`)
}
