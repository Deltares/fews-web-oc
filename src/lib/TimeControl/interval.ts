import type { TimeSettingsViewPeriodPreset } from '@deltares/fews-pi-requests'
import type { DurationLikeObject } from 'luxon'

export type Interval = IntervalItem | 'default' | 'custom'

export interface IntervalItem {
  start?: DurationLikeObject
  end?: DurationLikeObject
}

export interface LabeledIntervalItem extends IntervalItem {
  label: string
}

export function periodToIntervalItem(
  period: Omit<TimeSettingsViewPeriodPreset, 'label'>,
): IntervalItem {
  return {
    start: {
      [period.unit]: Number(period.start),
    },
    end: {
      [period.unit]: Number(period.end),
    },
  }
}

export function periodPresetToIntervalItem(
  preset: TimeSettingsViewPeriodPreset,
): LabeledIntervalItem {
  const period = periodToIntervalItem(preset)
  return {
    label: preset.label,
    start: period.start,
    end: period.end,
  }
}
