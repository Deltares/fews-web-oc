import {
  PiWebserviceProvider,
  type filterActionsFilter,
  type ActionsResponse,
  type timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import { ref, toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { DisplayConfig } from '../../lib/display/DisplayConfig.js'
import { timeSeriesDisplayToChartConfig } from '../../lib/charts/timeSeriesDisplayToChartConfig.js'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.js'
import { MD5 } from 'crypto-js'

export interface UseDisplayConfigReturn {
  displayConfig: Ref<DisplayConfig | undefined>
  displays: Ref<DisplayConfig[] | undefined>
}

export interface UseDisplayConfigOptions {
  convertDatum?: boolean
  useDisplayUnits?: boolean
}

type Filter = timeSeriesGridActionsFilter | filterActionsFilter
// Guard functions, needed because it is not possible to use instanceof/typeof on interfaces
function isFilterActionsFilter(filter: Filter): filter is filterActionsFilter {
  return (filter as filterActionsFilter).filterId !== undefined
}

function isTimeSeriesGridActionsFilter(
  filter: Filter,
): filter is timeSeriesGridActionsFilter {
  return (filter as timeSeriesGridActionsFilter).x !== undefined
}

/**
 * Converts the actions response to an array of display configurations.
 * @param actionsResponse The actions response object.
 * @returns An array of display configurations.
 */
function actionsResponseToDisplayConfig(
  actionsResponse: ActionsResponse,
  nodeId: string | undefined,
): DisplayConfig[] {
  const displays: DisplayConfig[] = []
  for (const result of actionsResponse.results) {
    if (result.config === undefined) continue
    const title = result.config.timeSeriesDisplay.title ?? ''
    const timeSeriesDisplayIndex = result.config.timeSeriesDisplay.index
    const subplots =
      result.config.timeSeriesDisplay.subplots?.map((subPlot) => {
        return timeSeriesDisplayToChartConfig(subPlot, title)
      }) ?? []
    const display: DisplayConfig = {
      id: title,
      title,
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
  nodeId: MaybeRefOrGetter<string>,
  plotId: MaybeRefOrGetter<number>,
  options?: MaybeRefOrGetter<UseDisplayConfigOptions>,
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const displayConfig = ref<DisplayConfig>()
  const displays = ref<DisplayConfig[]>()

  watchEffect(async () => {
    let filter: any = {}
    filter.nodeId = toValue(nodeId)
    const _plotId = toValue(plotId)
    const _options = toValue(options)
    filter = { ...filter, ..._options }
    const response = await piProvider.getTopologyActions(filter)
    const _displays = actionsResponseToDisplayConfig(response, toValue(nodeId))
    displays.value = _displays
    displayConfig.value = _displays[_plotId]
  })

  const shell = {
    displays,
    displayConfig,
  }

  return shell
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
  filter: MaybeRefOrGetter<Filter>,
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const displayConfig = ref<DisplayConfig>()
  const displays = ref<DisplayConfig[]>()

  watchEffect(async () => {
    const _filter = toValue(filter)
    let response: ActionsResponse
    let nodeId = undefined
    if (isFilterActionsFilter(_filter)) {
      if (!_filter.filterId) return
      response = await piProvider.getFilterActions(_filter)
    } else if (isTimeSeriesGridActionsFilter(_filter)) {
      response = await piProvider.getTimeSeriesGridActions(_filter)
      response.results.forEach((result) => {
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
    } else {
      displayConfig.value = undefined
      displays.value = undefined
      return
    }
    const _displays = actionsResponseToDisplayConfig(response, nodeId)
    console.log(_displays)
    displays.value = _displays
    displayConfig.value = _displays[0]
  })

  const shell = {
    displays,
    displayConfig,
  }

  return shell
}
