import { getResourcesStaticUrl } from '@/lib/fews-config'
import { useBaseMapsStore } from '@/stores/baseMaps'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useDark } from '@vueuse/core'
import { computed } from 'vue'

export function useBaseMap() {
  const baseMapsStore = useBaseMapsStore()
  const userSettingsStore = useUserSettingsStore()

  const isDark = useDark()

  const baseMap = computed(() => {
    const baseMapId = userSettingsStore.get('ui.map.theme')?.value as
      | string
      | undefined
    return baseMapsStore.getBaseMapById(baseMapId ?? 'automatic', isDark.value)
  })

  const mapStyle = computed(() => {
    const style = baseMap.value.style
    return style.startsWith('http') ? style : getResourcesStaticUrl(style)
  })

  return {
    baseMap,
    mapStyle,
  }
}
