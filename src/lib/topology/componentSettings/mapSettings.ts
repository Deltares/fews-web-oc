import type { DeepRequired } from '@/lib/utils/types'
import type { MapSettings as PiMapSettings } from '@deltares/fews-pi-requests'

type DeepRequiredMapSettings = DeepRequired<PiMapSettings>

export type MapSettings = Omit<DeepRequiredMapSettings, 'locationsLayer'> & {
  locationsLayer: Omit<
    DeepRequiredMapSettings['locationsLayer'],
    'minZoom' | 'maxZoom'
  >
}

export const defaultMapSettings: MapSettings = {
  wmsLayer: {
    show: true, // TODO: Implement
    autoPlay: false, // TODO: Implement
    animateVectors: true, // TODO: Implement
    doubleClickAction: true,
  },
  locationsLayer: {
    show: true,
    locationNames: true, // TODO: Implement
    singleClickAction: true,
    locationSearchEnabled: true,
  },
  overlays: [],
}
