import type { DeepRequired } from '@/lib/utils/types'
import type { MapSettings } from '@deltares/fews-pi-requests'

export const defaultMapSettings: DeepRequired<MapSettings> = {
  wmsLayer: {
    show: true,
    autoPlay: false,
    animateVectors: true,
    doubleClickAction: true,
  },
  locationsLayer: {
    show: true,
    locationNames: true,
    singleClickAction: true,
    locationSearchEnabled: true,
  },
  overlays: [],
}
