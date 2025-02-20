import type { DeepRequired } from '@/lib/utils/types'
import type { SSDSettings as PiSSDSettings } from '@deltares/fews-pi-requests'

export type SSDSettings = DeepRequired<PiSSDSettings>

export const defaultSchematicStatusDisplaySettings: SSDSettings = {
  zoomEnabled: false,
  singleClickAction: true,
  doubleClickAction: true,
  useBrowserStyle: false,
}
