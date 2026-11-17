import type { DeepRequired } from '@/lib/utils/types'
import type { MapSettings as PiMapSettings } from '@deltares/fews-pi-requests'

export type DeepRequiredMapSettings = DeepRequired<PiMapSettings>

export const defaultMapSettings: DeepRequiredMapSettings = {
  wmsLayer: {
    show: true, // TODO: Implement
    autoPlay: false,
    animateVectors: true, // TODO: Implement
    doubleClickAction: true,
  },
  locationsLayer: {
    show: true,
    locationNames: true,
    singleClickAction: true,
    locationSearchEnabled: true,
    minZoom: { level: -Infinity, levelLocationAttribute: '' },
    maxZoom: { level: Infinity, levelLocationAttribute: '' },
    legend: {
      show: true,
    },
  },
  overlays: [],
}
