import type { DeepRequired } from '@/lib/utils/types'
import type { MapSettings as PiMapSettings } from '@deltares/fews-pi-requests'

export type MapSettings = DeepRequired<PiMapSettings>

export const defaultMapSettings: MapSettings = {
  wmsLayer: {
    show: true, // TODO: Implement
    autoPlay: false, // TODO: Implement
    animateVectors: true, // TODO: Implement
    doubleClickAction: true, // TODO: Implement
  },
  locationsLayer: {
    show: true,
    locationNames: true, // TODO: Implement
    singleClickAction: true,
    locationSearchEnabled: true,
  },
  overlays: [],
}
