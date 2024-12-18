import type { TopologyNode } from '@deltares/fews-pi-requests'

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
