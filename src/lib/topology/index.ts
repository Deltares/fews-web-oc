export * from './locations'
import { configManager } from '@/services/application-config/index.ts'
import {
  PiWebserviceProvider,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

/**
 * Creates hash maps for topology nodes.
 *
 * This function generates two hash maps:
 * 1. idToNodeMap: Maps node IDs to their corresponding TopologyNode objects.
 * 2. childIdToParentNodeMap: Maps child node IDs to their parent node.
 *
 * @param {TopologyNode[] | undefined} nodes - An array of TopologyNode objects or undefined.
 * @returns {{ idToNodeMap: Map<string, TopologyNode>, childIdToParentNodeMap: Map<string, string> }} - An object containing the two hash maps.
 */
export function createTopologyHashMaps(nodes: TopologyNode[] | undefined): {
  idToNodeMap: Map<string, TopologyNode>
  childIdToParentNodeMap: Map<string, TopologyNode>
} {
  const idToNodeMap = new Map<string, TopologyNode>()
  const childIdToParentNodeMap = new Map<string, TopologyNode>()

  function recursivelyFillMaps(nodes: TopologyNode[]) {
    for (const node of nodes) {
      idToNodeMap.set(node.id, node)

      if (node.topologyNodes) {
        node.topologyNodes.forEach((childNode) => {
          childIdToParentNodeMap.set(childNode.id, node)
        })
        recursivelyFillMaps(node.topologyNodes)
      }
    }
  }

  if (nodes) {
    recursivelyFillMaps(nodes)
  }

  return {
    idToNodeMap,
    childIdToParentNodeMap,
  }
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
