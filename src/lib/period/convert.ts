import { ActionPeriod } from '@deltares/fews-pi-requests'
import { AbsolutePeriod, RelativePeriod } from './types'
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'

export function convertRelativeToAbsolutePeriod(
  relative: RelativePeriod,
  reference?: Date,
): AbsolutePeriod {
  const referenceTimestamp = reference?.getTime() ?? Date.now()
  return {
    startTimestamp: referenceTimestamp + relative.startOffsetSeconds * 1000,
    endTimestamp: referenceTimestamp + relative.endOffsetSeconds * 1000,
  }
}

export function convertActionPeriodToDomain(
  period: ActionPeriod | undefined,
): [Date, Date] | undefined {
  const startTime = period?.startDate
    ? convertFewsPiDateTimeToJsDate(period.startDate)
    : undefined

  const endTime = period?.endDate
    ? convertFewsPiDateTimeToJsDate(period.endDate)
    : undefined

  if (!startTime || !endTime) return
  return [startTime, endTime]
}
