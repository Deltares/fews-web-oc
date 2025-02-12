import DefaultBaseMaps from '@/assets/DefaultBaseMaps.json'
import type { UserSettingsWithIcon } from '@/stores/userSettings'
import type { MapLayerConfig } from '@deltares/fews-pi-requests'

interface BaseMap {
  id: string
  icon: string
  style: string
  name: string
}

export function getBaseMapUserSettingsFromConfig(config: MapLayerConfig) {
  const defaultBaseMaps: BaseMap[] = DefaultBaseMaps

  const baseMaps: BaseMap[] =
    config.mapLayers?.flatMap((layer, i) => {
      if (!layer.styleJsonFile) return []
      if (!layer.id) return []
      if (!layer.name) return []
      return [
        {
          id: layer.id,
          name: layer.name,
          style: layer.styleJsonFile,
          icon: `mdi-roman-numeral-${i + 1}`,
        },
      ]
    }) ?? []

  return [...defaultBaseMaps, ...baseMaps].map(convertBaseMapToUserSetting)
}

function convertBaseMapToUserSetting(baseMap: BaseMap): UserSettingsWithIcon {
  return {
    value: baseMap.id,
    icon: baseMap.icon,
  }
}
