import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import type {
  ActionResult,
  ActionsResponse,
  TimeSeriesDisplaySubplot,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import type { DisplayConfig } from './DisplayConfig'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import {
  convertFewsPiDateTimeToJsDate,
  convertJsDateToFewsPiDateTime,
} from '@/lib/date'
import { MD5 } from 'crypto-js'

/**
 * Applies colors to subplot items based on their taskRunIds.
 * @param subPlot The subplot to which colors will be applied.
 */
function applyColorsToSubplotItems(subPlot: TimeSeriesDisplaySubplot): void {
  const taskRunColorsStore = useTaskRunColorsStore()
  for (const item of subPlot.items) {
    // find the taskRunId in the actionRequest array
    const taskRunId = item.taskRunId
    if (!taskRunId) continue
    // Get color from the taskRunColorsStore
    const color = taskRunColorsStore.getColor(taskRunId)
    if (color) {
      item.color = color
    }
  }
}

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
  const uniquePlotIds = new Set<string>()
  for (const result of actionsResponse.results) {
    if (result.config === undefined) continue
    const title = result.config.timeSeriesDisplay.title ?? ''
    const timeSeriesDisplayIndex = result.config.timeSeriesDisplay.index
    const period = result.config.timeSeriesDisplay.period
    // TODO: Remove this when the backend is fixed to always return an unique plotId.
    let plotId = result.config.timeSeriesDisplay.plotId ?? crypto.randomUUID()
    if (uniquePlotIds.has(plotId)) {
      console.warn(
        `Duplicate plotId found: ${plotId}. Adding index to make it unique.`,
      )
      plotId = `${plotId}-${timeSeriesDisplayIndex}`
    }
    uniquePlotIds.add(plotId)

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
        applyColorsToSubplotItems(subPlot)
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

export function addIndexToKeys(results: ActionResult[]) {
  results.forEach((result) => {
    result.requests.forEach((request) => {
      request.key = MD5(request.request).toString()
    })
    if (result.config?.timeSeriesDisplay.subplots) {
      let i = 0
      result.config.timeSeriesDisplay.subplots.forEach((subPlot) => {
        subPlot.items.forEach((item) => {
          if (item.request === undefined) {
            item.request = `${result.requests[0].key}[${i}]`
          }
          i++
        })
      })
    }
  })
}

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

export function replaceDuplicateColors(
  response: ActionsResponse,
  colors: string[],
) {
  const seenColors = new Set<string>()
  const availableColors = [...colors].toReversed()

  const results = response.results
  const subplots = results.flatMap(
    (result) => result.config?.timeSeriesDisplay.subplots ?? [],
  )
  const subplotItems = subplots.flatMap((subplot) => subplot.items)

  function findValidColor() {
    while (availableColors.length > 0) {
      const color = availableColors.pop()
      if (color && !seenColors.has(color)) {
        return color
      }
    }
  }

  subplotItems.forEach((item) => {
    if (!item.color) return

    if (seenColors.has(item.color)) {
      const newColor = findValidColor()
      item.color = newColor ?? item.color
    }

    seenColors.add(item.color)
  })
}
