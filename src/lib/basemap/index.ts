import type { UserSettingsWithIcon } from '@/stores/userSettings'
import type { MapLayerConfig } from '@deltares/fews-pi-requests'
import { toCharacterIcon } from '@/lib/icons'

export interface BaseMap {
  id: string
  icon: string
  style: string
  name: string
}

export function getBaseMapsFromConfig(config: MapLayerConfig) {
  const baseMaps: BaseMap[] =
    config.mapLayers?.flatMap((layer) => {
      if (!layer.styleJsonFile) return []
      if (!layer.id) return []
      if (!layer.name) return []
      return [
        {
          id: layer.id,
          name: layer.name,
          style: layer.styleJsonFile,
          icon: toCharacterIcon(layer.name),
        },
      ]
    }) ?? []

  return baseMaps
}

export function convertBaseMapToUserSetting(
  baseMap: BaseMap,
): UserSettingsWithIcon {
  return {
    value: baseMap.id,
    icon: baseMap.icon,
  }
}
