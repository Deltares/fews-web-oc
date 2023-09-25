import { PiWebserviceProvider, TopologyNode } from '@deltares/fews-pi-requests'
import { ref, shallowRef } from 'vue'
import type { Ref } from 'vue'

export interface UseTopologyNodesReturn {
  error: Ref<any>
  nodes: Ref<TopologyNode[] | undefined>
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
export function useTopologyNodes(baseUrl: string): UseTopologyNodesReturn {
  const piProvider = new PiWebserviceProvider(baseUrl)

  const isReady = ref(false)
  const isLoading = ref(false)
  const nodes = ref<TopologyNode[]>()
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

  const shell = {
    nodes,
    isReady,
    isLoading,
    error,
  }

  return shell
}
