import type { DeepRequired } from '@/lib/utils/types'
import type { SSDSettings } from '@deltares/fews-pi-requests'

export const defaultSchematicStatusDisplaySettings: DeepRequired<SSDSettings> =
  {
    zoomEnabled: true,
    singleClickAction: true,
    doubleClickAction: true,
    useBrowserStyle: false,
  }
