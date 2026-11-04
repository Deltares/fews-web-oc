import type { DeepRequired } from '@/lib/utils/types'
import type { SidePanelSettings as PiSidePanelSettings } from '@deltares/fews-pi-requests'

export type SidePanelSettings = DeepRequired<PiSidePanelSettings>

export const defaultSidePanelSettings: SidePanelSettings = {
  showComponent: 'None',
}
