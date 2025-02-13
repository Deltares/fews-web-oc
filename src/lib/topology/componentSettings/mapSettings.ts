import type { DeepRequired } from '@/lib/utils/types'
import type { MapSettings as PiMapSettings } from '@deltares/fews-pi-requests'

export type MapSettings = DeepRequired<PiMapSettings> & {
  dateTimeSliderEnabled: boolean
}

export const defaultMapSettings: MapSettings = {
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
  dateTimeSliderEnabled: true,
}
