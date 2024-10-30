import type { ColumnItem } from "@/components/general/ColumnItem"
import type { TopologyNode, TopologyThresholdNode } from "@deltares/fews-pi-requests"

export function nodeButtonItems(
  node: TopologyNode,
  thresholds: TopologyThresholdNode[] | undefined,
  showActiveTresholds: boolean | undefined,
) {
  if (node.topologyNodes === undefined) return []
  return node.topologyNodes
    .filter((childNode) => topologyNodeIsVisible(childNode))
    .map((childNode) =>
      getColumnItemFromTopologyNode(childNode, thresholds, showActiveTresholds, node),
    )
}

export function recursiveUpdateNode(
  nodes: TopologyNode[],
  thresholds: TopologyThresholdNode[] | undefined,
  showActiveTresholdsCount: boolean | undefined,
  skipLeaves = false,
) {
  return nodes
    .filter((node) => topologyNodeIsVisible(node))
    .map((node) => {
      const result = getColumnItemFromTopologyNode(
        node,
        thresholds,
        showActiveTresholdsCount,
      )
      if (node.topologyNodes) {
        const items = recursiveUpdateNode(
          node.topologyNodes,
          thresholds,
          showActiveTresholdsCount,
          skipLeaves,
        )
        if (skipLeaves) {
          const itemsWithChildren = items.filter((i) => i.children)
          result.children = itemsWithChildren
        } else {
          result.children = items
        }
      }
      return result
    })
}


function getThresholdIcon(
  node: TopologyNode,
  thresholds: TopologyThresholdNode[] | undefined,
) {
  return thresholds?.find((t) => t.id === node.id)?.topologyLocationIcon
}

function getThresholdCount(
  node: TopologyNode,
  thresholds: TopologyThresholdNode[] | undefined,
) {
  return thresholds?.find((t) => t.id === node.id)?.filterLocationsCount
}

function getIcon(node: TopologyNode) {
  if (node.url && node.topologyNodes && !node.displayGroups)
    return 'mdi-open-in-new'
  return undefined
}

function getUrl(node: TopologyNode) {
  if (node.url) return node.url
  return undefined
}

function getColumnItemFromTopologyNode(
  node: TopologyNode,
  thresholds: TopologyThresholdNode[] | undefined,
  showActiveTresholdsCount: boolean | undefined,
  parentNode?: TopologyNode,
) {
  const result: ColumnItem = {
    id: node.id,
    name: node.name,
    icon: getIcon(node),
    thresholdIcon: getThresholdIcon(node, thresholds),
    thresholdCount: showActiveTresholdsCount
      ? getThresholdCount(node, thresholds)
      : undefined,
  }
  if (!hasSupportedDisplay(node) && node.url !== undefined) {
    result.href = getUrl(node)
  } else {
    result.to = {
      name: 'TopologyDisplay',
      params: {
        nodeId: parentNode ? [parentNode.id, node.id] : node.id,
      },
    }
  }
  return result
}

function topologyNodeIsVisible(node: TopologyNode): boolean {
  if (node.url !== undefined) return true
  if (hasSupportedDisplay(node)) return true
  if (node.topologyNodes === undefined) return false
  return node.topologyNodes.some(topologyNodeIsVisible)
}

function hasSupportedDisplay(node: TopologyNode): boolean {
  if (node.scadaPanelId !== undefined) return true
  if (
    node.filterIds !== undefined &&
    node.filterIds.length == 1 &&
    node.dataDownloadDisplay !== undefined
  )
    return true
  if (node.plotId != undefined && node.locationIds != undefined) return true
  if (node.filterIds !== undefined && node.filterIds.length > 0) return true
  if (node.gridDisplaySelection !== undefined) return true
  if (node.displayId !== undefined) return true
  if (node.displayGroups !== undefined && node.displayGroups.length > 0)
    return true
  return false
}
