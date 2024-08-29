import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { shallowRef, toValue, watchEffect } from 'vue'
import Basemaps from '@/assets/base-layers.json'
import { MglDefaults } from '@indoorequal/vue-maplibre-gl'
import { useDark } from '@vueuse/core'

export interface UseBaseLayersReturn {
  baseLayerStyle: ShallowRef<string | object>
  baseLayers: ShallowRef<(string | object)[]>
}

export function useBaseLayers(
  layerId: MaybeRefOrGetter<string | undefined>,
): UseBaseLayersReturn {
  const baseLayerStyle = shallowRef<string | object>(MglDefaults.style)
  const baseLayers = shallowRef<(string | object)[]>(Basemaps.baseLayers)

  const isDark = useDark()

  watchEffect(() => {
    const _layerId = toValue(layerId)
    const layerDefinition = Basemaps.baseLayers.find(
      (layer: any) => layer.id === _layerId,
    )
    if (layerDefinition?.automatic) {
      if (isDark.value === true) {
        const themedLayer = Basemaps.baseLayers.find(
          (layer: any) => layer.id === layerDefinition.automatic.dark,
        )
        if (themedLayer?.style) baseLayerStyle.value = themedLayer?.style
      } else {
        const themedLayer = Basemaps.baseLayers.find(
          (layer: any) => layer.id === layerDefinition.automatic.light,
        )
        if (themedLayer?.style) baseLayerStyle.value = themedLayer?.style
      }
    } else if (layerDefinition?.style) {
      baseLayerStyle.value = layerDefinition?.style
    }
  })

  return {
    baseLayerStyle,
    baseLayers,
  }
}
