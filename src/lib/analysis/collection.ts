import { DataAnalysisDisplayElement } from '@deltares/fews-pi-requests'
import type { Collection } from './types'
import {
  intervalToDateRange,
  periodToIntervalItem,
} from '@/lib/TimeControl/interval'

export function createCollection(
  name: string,
  config: DataAnalysisDisplayElement,
): Collection {
  const interval = periodToIntervalItem(config.relativeViewPeriod)
  const [startTime, endTime] = intervalToDateRange(interval)
  if (startTime === undefined || endTime === undefined) {
    throw new Error('Invalid interval for collection creation')
  }
  return {
    name,
    charts: [],
    settings: {
      startTime,
      endTime,
    },
  }
}
