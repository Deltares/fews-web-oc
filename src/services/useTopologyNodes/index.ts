import {
  PiWebserviceProvider,
  type TopologyActionFilter,
} from '@deltares/fews-pi-requests'
import { ref, toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { DisplayConfig } from '../../lib/display/DisplayConfig.js'
import { timeSeriesDisplayToChartConfig } from '../../lib/charts/timeSeriesDisplayToChartConfig'
import { ChartConfig } from '../../lib/charts/types/ChartConfig.js'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.js'

export interface UseDisplayConfigReturn {
  displayConfig: Ref<DisplayConfig | undefined>
  displays: Ref<DisplayConfig[] | undefined>
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
    const _displays: DisplayConfig[] = []
    const filter = {} as TopologyActionFilter
    filter.nodeId = toValue(nodeId)
    const _plotId = toValue(plotId)
    const response = await piProvider.getTopologyActions(filter)
    for (const result of response.results) {
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
      _displays.push(display)
    }
    displays.value = _displays
    displayConfig.value = _displays[_plotId]
  })

  const shell = {
    displays,
    displayConfig,
  }

  return shell
}
