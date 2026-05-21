import { ParameterLevelThresholdWarningLevels } from '@deltares/fews-pi-requests'

export interface WarningLevel extends ParameterLevelThresholdWarningLevels {
  count: number
  locationCount: number
}
