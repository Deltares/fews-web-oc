import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { shallowRef, toValue, watchEffect } from 'vue'
import Basemaps from '@/assets/base-layers.json'
import { MglDefaults } from 'vue-maplibre-gl'

export interface UseBaseLayersReturn {
  baseLayerStyle: ShallowRef<string | object>
  baseLayers: ShallowRef<(string | object)[]>
}

export function useBaseLayers(
  layerId: MaybeRefOrGetter<string | undefined>,
): UseBaseLayersReturn {
  const baseLayerStyle = shallowRef<string | object>(MglDefaults.style)
  const baseLayers = shallowRef<(string | object)[]>(Basemaps.baseLayers)
  const defaultLayerId = Basemaps.default
  const defaultLayer = Basemaps.baseLayers.find(
    (layer: any) => layer.id === defaultLayerId,
  )
  if (defaultLayer?.style) {
    console.log('defaultLayer.style', defaultLayer.style)
    baseLayerStyle.value = defaultLayer.style
  }

  watchEffect(() => {
    const _layerId = toValue(layerId)
    const layerDefinition = Basemaps.baseLayers.find(
      (layer: any) => layer.id === _layerId,
    )
    if (layerDefinition?.style) baseLayerStyle.value = layerDefinition?.style
  })

  return {
    baseLayerStyle,
    baseLayers,
  }
}
