import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import type {
  ActionPeriod,
  ActionRequest,
  ActionResult,
  ActionsResponse,
  TimeSeriesDisplaySubplot,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import type { DisplayConfig } from './DisplayConfig'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import {
  convertJsDateToFewsPiDateTime,
  convertJSDateToFewsPiParameter,
} from '@/lib/date'
import { MD5 } from 'crypto-js'
import { uid } from '@/lib/utils/uid'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { convertActionPeriodToDomain } from '@/lib/period'

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
): DisplayConfig[] {
  const displays: DisplayConfig[] = []
  const uniquePlotIds = new Set<string>()
  for (const result of actionsResponse.results) {
    if (result.config === undefined) continue
    const title = result.config.timeSeriesDisplay.title ?? ''
    const timeSeriesDisplayIndex = result.config.timeSeriesDisplay.index
    // TODO: Remove this when the backend is fixed to always return an unique plotId.
    let plotId = result.config.timeSeriesDisplay.plotId ?? uid()
    if (uniquePlotIds.has(plotId)) {
      console.warn(
        `Duplicate plotId found: ${plotId}. Adding index to make it unique.`,
      )
      plotId = `${plotId}-${timeSeriesDisplayIndex}`
    }
    uniquePlotIds.add(plotId)

    const subplots =
      result.config.timeSeriesDisplay.subplots?.map((subPlot) => {
        applyColorsToSubplotItems(subPlot)
        return timeSeriesDisplayToChartConfig(subPlot)
      }) ?? []
    const period = result.config.timeSeriesDisplay.period
    const display: DisplayConfig = {
      id: title,
      title,
      forecastLegend: result.config.timeSeriesDisplay.forecastLegend,
      plotId,
      nodeId: nodeId,
      class: 'singles',
      index: timeSeriesDisplayIndex,
      requests: addPeriodIfNotSet(result.requests, period),
      period,
      subplots,
    }
    displays.push(display)
  }
  return displays
}

function addPeriodIfNotSet(
  requests: ActionRequest[],
  period: ActionPeriod | undefined,
): ActionRequest[] {
  const domain = period ? convertActionPeriodToDomain(period) : undefined
  return requests.map((request) => {
    const url = request.request
    if (
      domain === undefined ||
      url.includes('startTime') ||
      url.includes('endTime')
    ) {
      return request
    }

    const startTime = convertJSDateToFewsPiParameter(domain[0])
    const endTime = convertJSDateToFewsPiParameter(domain[1])
    return {
      ...request,
      request: `${url}&startTime=${startTime}&endTime=${endTime}`,
    }
  })
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

export function getSubplotsWithDomain(
  config: DisplayConfig,
  startTime: Date | undefined,
  endTime: Date | undefined,
) {
  const period = convertActionPeriodToDomain(config.period)

  const _startTime = startTime ?? period?.[0]
  const _endTime = endTime ?? period?.[1]

  return config.subplots.map((subplot) =>
    getSubplotWithDomain(
      subplot,
      _startTime && _endTime ? [_startTime, _endTime] : undefined,
    ),
  )
}

export function getSubplotWithDomain(
  subplot: ChartConfig,
  domain: [Date, Date] | undefined,
) {
  if (!domain) return subplot

  const axis = subplot.xAxis?.[0]
  const updatedAxis = { ...axis, domain }

  return {
    ...subplot,
    xAxis: updatedAxis ? [updatedAxis] : subplot.xAxis,
  }
}
