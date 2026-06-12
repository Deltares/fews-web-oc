import type { DeepRequired } from '@/lib/utils/types'
import type { MapSettings as PiMapSettings } from '@deltares/fews-pi-requests'

type DeepRequiredMapSettings = DeepRequired<PiMapSettings>

export type MapSettings = Omit<DeepRequiredMapSettings, 'locationsLayer'> & {
  wmsLayer: DeepRequiredMapSettings['wmsLayer'] & {
    autoRefreshInterval: number
  }
  locationsLayer: Omit<
    DeepRequiredMapSettings['locationsLayer'],
    'minZoom' | 'maxZoom'
  >
}

export const defaultMapSettings: MapSettings = {
  wmsLayer: {
    show: true,
    autoPlay: false,
    animateVectors: true,
    doubleClickAction: true,
    autoRefreshInterval: 60000,
  },
  locationsLayer: {
    show: true,
    locationNames: true,
    singleClickAction: true,
    locationSearchEnabled: true,
  },
  overlays: [],
}
