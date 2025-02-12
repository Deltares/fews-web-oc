import type { DeepRequired } from '@/lib/utils/types'
import type { SSDSettings as PiSSDSettings } from '@deltares/fews-pi-requests'

export type SSDSettings = DeepRequired<PiSSDSettings> & {
  dateTimeSliderEnabled: boolean
}

export const defaultSchematicStatusDisplaySettings: SSDSettings = {
  zoomEnabled: true,
  singleClickAction: true,
  doubleClickAction: true,
  useBrowserStyle: false,
  dateTimeSliderEnabled: true,
}
