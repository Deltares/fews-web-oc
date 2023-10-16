import {
  PiWebserviceProvider,
  TopologyActionFilter,
  TopologyNode,
} from '@deltares/fews-pi-requests'
import { ref, shallowRef, toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { DisplayConfig } from '../../lib/display/DisplayConfig.js'
import { timeSeriesDisplayToChartConfig } from '../../lib/charts/timeSeriesDisplayToChartConfig'
import { ChartConfig } from '../../lib/charts/types/ChartConfig.js'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.js'

export interface UseTopologyNodesReturn {
  error: Ref<any>
  nodes: Ref<TopologyNode[] | undefined>
  displayConfig: Ref<DisplayConfig | undefined>
  displays: Ref<DisplayConfig[] | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

function fillNodeMap(node: TopologyNode, map: Map<string, string>) {
  if (node.url !== undefined) {
    map.set(node.id, node.url)
  }
  node.topologyNodes?.forEach((childNode) => fillNodeMap(childNode, map))
}

/**
 * Reactive async state. Will not block your setup function and will trigger changes once
 * the promise is ready.
 *
 * @see https://vueuse.org/useAsyncState
 * @param url    The initial state, used until the first evaluation finishes
 */
export function useTopologyNodes(
  baseUrl: string,
  nodeId: MaybeRefOrGetter<string>,
  plotId: MaybeRefOrGetter<number>,
): UseTopologyNodesReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const isReady = ref(false)
  const isLoading = ref(false)
  const nodes = ref<TopologyNode[]>()
  const displayConfig = ref<DisplayConfig>()
  const displays = ref<DisplayConfig[]>()
  const error = shallowRef<unknown | undefined>(undefined)
  const urlTopologyNodeMap: Map<string, string> = new Map<string, string>()

  async function loadTopologyNodes(): Promise<void> {
    isLoading.value = true
    isReady.value = false

    try {
      const response = await piProvider.getTopologyNodes()
      response.topologyNodes.forEach((node) =>
        fillNodeMap(node, urlTopologyNodeMap),
      )
      nodes.value = response.topologyNodes
    } catch (error) {
      error = 'error-loading'
    } finally {
      isLoading.value = false
      isReady.value = true
    }
  }

  loadTopologyNodes()

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
    nodes,
    displays,
    displayConfig,
    isReady,
    isLoading,
    error,
  }

  return shell
}
