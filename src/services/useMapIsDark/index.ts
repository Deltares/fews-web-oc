import { computed, onBeforeUnmount, ref } from 'vue'
import { isMapStyleDark } from '@/lib/map/theme'
import { useBaseMap } from '@/services/useBaseMap'
import { useDark } from '@/services/useDark'
import { useMap } from '@/services/useMap'
import { useBaseMapsStore } from '@/stores/baseMaps'

/**
 * Whether the current base map is dark. The default dark and light base maps
 * are known, for other base maps the background color of the map style is
 * used. Falls back to the application theme if neither is conclusive.
 */
export function useMapIsDark() {
  const { map } = useMap()
  const { baseMap } = useBaseMap()
  const baseMapsStore = useBaseMapsStore()
  const isAppDark = useDark()

  const isStyleDark = ref<boolean>()

  function updateIsStyleDark() {
    if (!map?.isStyleLoaded()) return
    isStyleDark.value = isMapStyleDark(map)
  }

  updateIsStyleDark()
  map?.on('styledata', updateIsStyleDark)
  onBeforeUnmount(() => {
    map?.off('styledata', updateIsStyleDark)
  })

  return computed(() => {
    const baseMapId = baseMap.value.id
    if (baseMapId === baseMapsStore.defaultDarkId) return true
    if (baseMapId === baseMapsStore.defaultLightId) return false
    return isStyleDark.value ?? isAppDark.value
  })
}
