import {
  PiWebserviceProvider,
  type filterActionsFilter,
  type TopologyActionFilter,
  type ActionsResponse,
} from '@deltares/fews-pi-requests'
import { ref, toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { DisplayConfig } from '../../lib/display/DisplayConfig.js'
import { timeSeriesDisplayToChartConfig } from '../../lib/charts/timeSeriesDisplayToChartConfig.js'
import { ChartConfig } from '../../lib/charts/types/ChartConfig.js'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.js'

export interface UseDisplayConfigReturn {
  displayConfig: Ref<DisplayConfig | undefined>
  displays: Ref<DisplayConfig[] | undefined>
}

/**
 * Converts the actions response to an array of display configurations.
 * @param actionsResponse The actions response object.
 * @returns An array of display configurations.
 */
function actionsResponseToDisplayConfig(
  actionsResponse: ActionsResponse,
): DisplayConfig[] {
  const displays: DisplayConfig[] = []
  for (const result of actionsResponse.results) {
    if (result.config === undefined) continue
    const title = result.config.timeSeriesDisplay.title ?? ''
    let subplots: ChartConfig[] = []
    if (result.config.timeSeriesDisplay.subplots) {
      subplots = result.config.timeSeriesDisplay.subplots?.map((subPlot) => {
        return timeSeriesDisplayToChartConfig(subPlot, title)
      })
    }
    const display: DisplayConfig = {
      id: title,
      title,
      class: 'singles',
      requests: result.requests,
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
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const displayConfig = ref<DisplayConfig>()
  const displays = ref<DisplayConfig[]>()

  watchEffect(async () => {
    const filter = {} as TopologyActionFilter
    filter.nodeId = toValue(nodeId)
    const _plotId = toValue(plotId)
    const response = await piProvider.getTopologyActions(filter)
    const _displays = actionsResponseToDisplayConfig(response)
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
 * @param filterIds The IDs of the filters.
 * @param locationIds The IDs of the locations.
 * @returns An object with `displays` and `displayConfig` properties.
 */
export function useDisplayConfigFilter(
  baseUrl: string,
  filterIds: MaybeRefOrGetter<string[] | undefined>,
  locationIds: MaybeRefOrGetter<string>,
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const displayConfig = ref<DisplayConfig>()
  const displays = ref<DisplayConfig[]>()

  watchEffect(async () => {
    const filter = {} as filterActionsFilter
    const _filterIds = toValue(filterIds)
    if (_filterIds !== undefined) {
      filter.filterId = _filterIds[0]
      filter.locationIds = toValue(locationIds)
      const response = await piProvider.getFilterActions(filter)
      const _displays = actionsResponseToDisplayConfig(response)
      displays.value = _displays
      displayConfig.value = _displays[0]
    }
  })

  const shell = {
    displays,
    displayConfig,
  }

  return shell
}
