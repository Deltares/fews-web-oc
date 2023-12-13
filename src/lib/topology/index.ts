export * from './locations'
import { configManager } from '../../services/application-config/index.ts'
import {
  PiWebserviceProvider,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

/**
 * Recursively updates a topology map where each node is stored by its id.
 *
 * @param {TopologyNode[] | undefined} nodes - An array of TopologyNode objects or undefined.
 * @param {Map<string, TopologyNode>} topologyMap - A Map used to store the topology nodes.
 */
export function createTopologyMap(nodes: TopologyNode[] | undefined) {
  const topologyMap = new Map<string, TopologyNode>()

  function recursiveCreateTopologyMap(
    nodes: TopologyNode[] | undefined,
    topologyMap: Map<string, TopologyNode>,
  ) {
    if (nodes === undefined) return undefined
    for (const node of nodes) {
      topologyMap.set(node.id, node)
      recursiveCreateTopologyMap(node.topologyNodes, topologyMap)
    }
  }

  recursiveCreateTopologyMap(nodes, topologyMap)
  return topologyMap
}

/**
 * Fetch the topology nodes from the FEWS web services.
 *
 * @returns {Promise<TopologyNode[]>} - An array of TopologyNode objects.
 */
export async function getTopologyNodes(): Promise<TopologyNode[]> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  let nodes: TopologyNode[] = []
  try {
    const response = await piProvider.getTopologyNodes()
    nodes = response.topologyNodes
  } catch (error) {
    error = 'error-loading'
  }

  return nodes
}
