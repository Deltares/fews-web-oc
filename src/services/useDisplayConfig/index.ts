import {
  ActionResult,
  PiWebserviceProvider,
  TimeSeriesDisplaySubplot,
  type ActionsResponse,
  type Color,
} from '@deltares/fews-pi-requests'
import { computed, ref, toValue, watch, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { DisplayConfig } from '../../lib/display/DisplayConfig.js'
import { timeSeriesDisplayToChartConfig } from '../../lib/charts/timeSeriesDisplayToChartConfig.js'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.js'
import { MD5 } from 'crypto-js'
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'
import {
  type Filter,
  isFilterActionsFilter,
  isTimeSeriesGridActionsFilter,
} from '@/lib/filters'

export interface UseDisplayConfigReturn {
  displayConfig: Ref<DisplayConfig | null>
  displays: Ref<DisplayConfig[] | null>
}

export interface UseDisplayConfigOptions {
  convertDatum?: boolean
  useDisplayUnits?: boolean
}

/**
 * Applies colors to subplot items based on their IDs.
 * @param subPlot The subplot to which colors will be applied.
 * @param colors The array of colors to be used.
 * @param colorsMapping A map to store the mapping of series IDs to colors.
 */
function applyColorsToSubplotItems(
  subPlot: TimeSeriesDisplaySubplot,
  colors: Color[],
  colorsMapping: Map<string, string>,
): void {
  for (const item of subPlot.items) {
    // Split the request to get the part corresponding to the runId
    const seriesId = item.request?.split('__').pop() ?? ''
    // check if the mapping already exists, if so use it
    if (colorsMapping.has(seriesId)) {
      item.color = colorsMapping.get(seriesId)
    } else {
      // If we are out of colors, we can stop assigning colors
      // and use the default color of the chart
      if (colors.length === 0) {
        return
      }
      // Assign the color to the item from the colors array and create a mapping
      const currentColor = colors.pop()?.color
      if (currentColor) {
        item.color = currentColor
        colorsMapping.set(seriesId, currentColor)
      }
    }
  }
}

/**
 * Converts the actions response to an array of display configurations.
 * @param actionsResponse The actions response object.
 * @returns An array of display configurations.
 */
function actionsResponseToDisplayConfig(
  actionsResponse: ActionsResponse,
  nodeId: string | undefined,
  colors: Color[],
  colorsMapping: Map<string, string>,
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
        applyColorsToSubplotItems(subPlot, colors, colorsMapping)
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

/**
 * Create the displays and the display configs of a node and selected time series display.
 *
 * @param {string} baseUrl  url of the FEWS web services.
 * @param {string} nodeId  id of the topology node.
 * @param {number} plotId  number of the plot node of a display group.
 */
export function useDisplayConfig(
  baseUrl: string,
  nodeId: MaybeRefOrGetter<string | undefined>,
  plotId: MaybeRefOrGetter<string | undefined>,
  startTime?: MaybeRefOrGetter<Date | undefined>,
  endTime?: MaybeRefOrGetter<Date | undefined>,
  options?: MaybeRefOrGetter<UseDisplayConfigOptions>,
  taskRunIds?: MaybeRefOrGetter<string[]>,
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const response = ref<ActionsResponse>()
  const displays = ref<DisplayConfig[] | null>(null)
  const colorsMapping = new Map<string, string>()
  let colors: Color[] = []
  piProvider.getColors().then((response) => {
    if (response.colors) {
      colors = response.colors.reverse()
    }
  })

  watchEffect(async () => {
    const _nodeId = toValue(nodeId)
    if (_nodeId === undefined) return

    const filter = {
      nodeId: _nodeId,
      ...toValue(options),
    }

    const _taskRunIds = toValue(taskRunIds)
    const taskRunsFilter = {
      ...filter,
      // TODO: Change this to string.join(',') when the backend is fixed
      taskRunIds: _taskRunIds,
      currentForecastsAlwaysVisible: true,
    }

    response.value = await piProvider.getTopologyActions(
      _taskRunIds?.length ? taskRunsFilter : filter,
    )
  })

  watch([startTime, endTime, response], () => {
    if (!response.value) return

    const _nodeId = toValue(nodeId)
    const _startTime = toValue(startTime)
    const _endTime = toValue(endTime)

    displays.value = actionsResponseToDisplayConfig(
      response.value,
      _nodeId,
      colors,
      colorsMapping,
      _startTime,
      _endTime,
    )
  })

  const displayConfig = computed<DisplayConfig | null>((oldDisplayConfig) => {
    const _plotId = toValue(plotId)
    if (!displays.value) return null
    return (
      displays.value.find((d) => d.plotId === _plotId) ??
      oldDisplayConfig ??
      null
    )
  })

  return {
    displays,
    displayConfig,
  }
}

/**
 * Create the displays and the display configs for a time series display using filter actions.
 *
 * @param baseUrl The URL of the FEWS web services.
 * @params filter The filter for the actions request.
 * @returns An object with `displays` and `displayConfig` properties.
 */
export function useDisplayConfigFilter(
  baseUrl: string,
  filter: MaybeRefOrGetter<Filter | undefined>,
  startTime: MaybeRefOrGetter<Date | undefined>,
  endTime: MaybeRefOrGetter<Date | undefined>,
  taskRunIds?: MaybeRefOrGetter<string[]>,
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const colorsMapping = new Map<string, string>()
  let colors: Color[] = []
  piProvider.getColors().then((response) => {
    if (response.colors) {
      colors = response.colors.reverse()
    }
  })

  const displayConfig = ref<DisplayConfig | null>(null)
  const displays = ref<DisplayConfig[] | null>(null)
  const response = ref<ActionsResponse>()

  watchEffect(async () => {
    const _filter = toValue(filter)
    if (_filter === undefined) return

    if (isFilterActionsFilter(_filter)) {
      if (!_filter.filterId) return

      const _taskRunIds = toValue(taskRunIds)
      const taskRunsFilter = {
        ..._filter,
        taskRunIds: _taskRunIds?.join(','),
        currentForecastsAlwaysVisible: true,
      }

      const _response = await piProvider.getFilterActions(
        _taskRunIds?.length ? taskRunsFilter : _filter,
      )
      response.value = _response
    } else if (isTimeSeriesGridActionsFilter(_filter)) {
      const _response = await piProvider.getTimeSeriesGridActions(_filter)
      addIndexToKeys(_response.results)
      response.value = _response
    } else {
      displayConfig.value = null
      displays.value = null
      return
    }
  })

  // Use a second watchEffect to not trigger a fetch on these reactive variables
  watchEffect(() => {
    if (!response.value) return

    const _startTime = toValue(startTime)
    const _endTime = toValue(endTime)
    let nodeId = undefined

    const _displays = actionsResponseToDisplayConfig(
      response.value,
      nodeId,
      colors,
      colorsMapping,
      _startTime,
      _endTime,
    )
    displays.value = _displays
    displayConfig.value = _displays[0]
  })

  const shell = {
    displays,
    displayConfig,
  }

  return shell
}

function addIndexToKeys(results: ActionResult[]) {
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
