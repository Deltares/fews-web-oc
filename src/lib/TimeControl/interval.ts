import type { TimeSettingsViewPeriodPreset } from '@deltares/fews-pi-requests'
import type { DurationLikeObject } from 'luxon'
import { addDuration, convertJSDateToFewsPiParameter } from '@/lib/date'

export type Interval = IntervalItem | 'default' | 'custom'

export interface IntervalItem {
  start?: DurationLikeObject
  end?: DurationLikeObject
}

export interface LabeledIntervalItem extends IntervalItem {
  label: string
}

interface Period {
  unit: string
  start?: string
  end?: string
}

export function periodToIntervalItem(period: Period): IntervalItem {
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

export function intervalToDateRange(interval: IntervalItem, date = new Date()) {
  const start = interval.start ? addDuration(date, interval.start) : undefined
  const end = interval.end ? addDuration(date, interval.end) : undefined

  return [start, end]
}

export function intervalToFewsPiDateRange(
  interval: IntervalItem,
  date = new Date(),
) {
  return intervalToDateRange(interval, date).map((d) =>
    d ? convertJSDateToFewsPiParameter(d) : undefined,
  )
}
