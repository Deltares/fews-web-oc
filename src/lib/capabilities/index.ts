import type { Layer } from '@deltares/fews-wms-requests'
import { toDateRangeString, toHumanReadableDateTime } from '@/lib/date'

export function getForecastTime(capabilities: Layer | undefined) {
  const forecastTime = capabilities?.keywordList?.[0].forecastTime
  if (!forecastTime) return

  return new Date(forecastTime)
}

export function getForecastTimeString(capabilities: Layer | undefined) {
  const forecastTime = getForecastTime(capabilities)
  if (!forecastTime) return

  if (isNaN(forecastTime.getTime())) {
    return 'Analysis time not available'
  }

  return `Analysis time: ${toHumanReadableDateTime(forecastTime)}`
}

export function getValueTimeRangeString(capabilities: Layer | undefined) {
  if (capabilities?.completelyMissing ?? false)
    return 'Currently no data available'

  return toDateRangeString(
    capabilities?.firstValueTime,
    capabilities?.lastValueTime,
  )
}
