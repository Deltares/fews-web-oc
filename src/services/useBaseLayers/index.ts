import type { ShallowRef } from 'vue'
import { shallowRef } from 'vue'
import Basemaps from '@/assets/base-layers.json'
import { MglDefaults } from 'vue-maplibre-gl'

export interface UseBaseLayersReturn {
  baseLayerStyle: ShallowRef<string | object>
  baseLayers: ShallowRef<(string | object)[]>
}

export function useBaseLayers(): UseBaseLayersReturn {
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

  return {
    baseLayerStyle,
    baseLayers,
  }
}
