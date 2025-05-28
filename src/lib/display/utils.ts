import type {
  ActionResult,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import { convertJsDateToFewsPiDateTime } from '@/lib/date'

export function addFilterPeriodToConfig(
  results: ActionResult[],
  filter: timeSeriesGridActionsFilter,
) {
  if (!filter.startTime || !filter.endTime) return

  const startDate = convertJsDateToFewsPiDateTime(new Date(filter.startTime))
  const endDate = convertJsDateToFewsPiDateTime(new Date(filter.endTime))

  results.forEach((result) => {
    if (!result.config) return

    const hasPeriod = result.config.timeSeriesDisplay.period !== undefined
    if (hasPeriod) return

    result.config.timeSeriesDisplay.period = {
      startDate,
      endDate,
    }
  })
}
