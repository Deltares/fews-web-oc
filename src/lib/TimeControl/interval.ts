import { TimeSettingsViewPeriodPreset } from '@deltares/fews-pi-requests'
import type { DurationLikeObject } from 'luxon'

export type Interval = IntervalItem | 'default' | 'custom'

export interface IntervalItem {
  label: string
  start?: DurationLikeObject
  end?: DurationLikeObject
}

export function periodPresetToIntervalItem(
  preset: TimeSettingsViewPeriodPreset,
) {
  const start = {
    [preset.unit]: Number(preset.start),
  }
  const end = {
    [preset.unit]: Number(preset.end),
  }
  return {
    label: preset.label,
    start: preset.start ? start : undefined,
    end: preset.end ? end : undefined,
  }
}
