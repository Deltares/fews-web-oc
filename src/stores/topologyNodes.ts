import { createTopologyHashMaps } from '@/lib/topology/createTopologyHashMaps'
import { getTopologyNodes } from '@/lib/topology/getTopologyNodes'
import { TopologyNode } from '@deltares/fews-pi-requests'
import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export const useTopologyNodesStore = defineStore('topologyNodes', () => {
  const nodes = ref<TopologyNode[]>([])
  const _idToNodeMap = ref<Map<string, TopologyNode>>(new Map())
  const _childIdToParentNodeMap = ref<Map<string, TopologyNode>>(new Map())

  watchEffect(() => {
    const { idToNodeMap, childIdToParentNodeMap } = createTopologyHashMaps(
      nodes.value,
    )
    _idToNodeMap.value = idToNodeMap
    _childIdToParentNodeMap.value = childIdToParentNodeMap
  })

  function getSubNodesForIds(nodeIds?: string[]) {
    if (!nodeIds) return nodes.value

    return nodeIds.flatMap((nodeId) => {
      const node = _idToNodeMap.value.get(nodeId)
      return node ? [node] : []
    })
  }

  function getFirstLeafNodeForId(nodeId: string): TopologyNode | undefined {
    const node = _idToNodeMap.value.get(nodeId)
    if (!node) return undefined
    if (node.topologyNodes && node.topologyNodes.length > 0) {
      return getFirstLeafNodeForId(node.topologyNodes[0].id)
    }
    // If the node has no children, return itself
    return node
  }

  function getNodeById(nodeId: string): TopologyNode | undefined {
    return _idToNodeMap.value.get(nodeId)
  }

  function getParentNodeById(childNodeId: string) {
    return _childIdToParentNodeMap.value.get(childNodeId)
  }

  async function fetch() {
    nodes.value = await getTopologyNodes()
  }

  return {
    nodes,
    fetch,
    _idToNodeMap,
    _childIdToParentNodeMap,
    getSubNodesForIds,
    getFirstLeafNodeForId,
    getNodeById,
    getParentNodeById,
  }
})
