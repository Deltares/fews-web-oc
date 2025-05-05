import type { ActionsResponse } from '@deltares/fews-pi-requests'
import type { DisplayConfig } from '@/lib/display/DisplayConfig'
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'

/**
 * Converts the actions response to an array of display configurations.
 * @param actionsResponse The actions response object.
 * @returns An array of display configurations.
 */
export function actionsResponseToDisplayConfig(
  actionsResponse: ActionsResponse,
  nodeId: string | undefined,
  startTime?: Date,
  endTime?: Date,
): DisplayConfig[] {
  const displays: DisplayConfig[] = []
  for (const result of actionsResponse.results) {
    if (result.config === undefined) continue
    const title = result.config.timeSeriesDisplay.title ?? ''
    const timeSeriesDisplayIndex = result.config.timeSeriesDisplay.index
    const period = result.config.timeSeriesDisplay.period
    const plotId = result.config.timeSeriesDisplay.plotId

    // The period is always specified in UTC.
    const timeZoneOffsetString = 'Z'
    let configPeriod: [Date, Date]
    if (period) {
      const periodStart = convertFewsPiDateTimeToJsDate(
        period.startDate,
        timeZoneOffsetString,
      )
      const periodEnd = convertFewsPiDateTimeToJsDate(
        period.endDate,
        timeZoneOffsetString,
      )
      configPeriod = [startTime ?? periodStart, endTime ?? periodEnd]
    }

    const subplots =
      result.config.timeSeriesDisplay.subplots?.map((subPlot) => {
        return timeSeriesDisplayToChartConfig(subPlot, configPeriod)
      }) ?? []
    const display: DisplayConfig = {
      id: title,
      title,
      forecastLegend: result.config.timeSeriesDisplay.forecastLegend,
      plotId,
      nodeId: nodeId,
      class: 'singles',
      index: timeSeriesDisplayIndex,
      requests: result.requests,
      period: result.config.timeSeriesDisplay.period,
      subplots,
    }
    displays.push(display)
  }
  return displays
}
