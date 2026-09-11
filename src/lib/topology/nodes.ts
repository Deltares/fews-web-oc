import type { ColumnItem } from '@/components/general/ColumnItem'
import type {
  TopologyNode,
  TopologyThresholdNode,
} from '@deltares/fews-pi-requests'

interface TopologyNodeWithReportModuleInstanceId extends TopologyNode {
  reportModuleInstanceId?: string | string[]
}

export function nodeButtonItems(
  node: TopologyNode,
  topologyId: string | undefined,
  thresholds: TopologyThresholdNode[] | undefined,
  showActiveTresholds: boolean | undefined,
) {
  if (node.topologyNodes === undefined) return []
  return node.topologyNodes
    .filter((childNode) => topologyNodeIsVisible(childNode))
    .map((childNode) =>
      getColumnItemFromTopologyNode(
        childNode,
        thresholds,
        showActiveTresholds,
        topologyId,
        node,
      ),
    )
}

export function recursiveUpdateNode(
  nodes: TopologyNode[],
  thresholds: TopologyThresholdNode[] | undefined,
  showActiveTresholdsCount: boolean | undefined,
  topologyId: string | undefined,
  skipLeaves = false,
) {
  return nodes
    .filter((node) => topologyNodeIsVisible(node))
    .map((node) => {
      const result = getColumnItemFromTopologyNode(
        node,
        thresholds,
        showActiveTresholdsCount,
        topologyId,
      )
      if (node.topologyNodes) {
        const items = recursiveUpdateNode(
          node.topologyNodes,
          thresholds,
          showActiveTresholdsCount,
          topologyId,
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
  return node.iconId
}

function getAppendIcon(node: TopologyNode) {
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
  topologyId: string | undefined,
  parentNode?: TopologyNode,
) {
  const result: ColumnItem = {
    id: node.id,
    name: node.name,
    icon: getIcon(node),
    appendIcon: getAppendIcon(node),
    thresholdIcon: getThresholdIcon(node, thresholds),
    thresholdCount: showActiveTresholdsCount
      ? getThresholdCount(node, thresholds)
      : undefined,
  }
  if (!hasSupportedDisplay(node) && node.url !== undefined) {
    result.href = getUrl(node)
  } else if (nodeIsSelectable(node)) {
    result.to = {
      name: 'TopologyDisplay',
      params: {
        nodeId: parentNode ? [parentNode.id, node.id] : node.id,
        topologyId,
      },
    }
  }
  return result
}

function nodeIsSelectable(node: TopologyNode): boolean {
  if (node.topologyNodes !== undefined) return nodeHasReports(node)
  return hasSupportedDisplay(node)
}

function topologyNodeIsVisible(node: TopologyNode): boolean {
  if (node.url !== undefined) return true
  if (hasSupportedDisplay(node)) return true
  if (node.topologyNodes === undefined) return false
  return node.topologyNodes.some(topologyNodeIsVisible)
}

function hasSupportedDisplay(node: TopologyNode): boolean {
  return (
    nodeHasSchematicStatusDisplay(node) ||
    nodeHasMap(node) ||
    nodeHasCharts(node) ||
    nodeHasDataDownload(node) ||
    nodeHasReports(node) ||
    nodeHasSystemMonitor(node) ||
    nodeHasWebDisplay(node) ||
    nodeHasDashboard(node) ||
    nodeHasWebDisplay(node) ||
    nodeHasLogDisplay(node) ||
    nodeHasDynamicReportDisplay(node) ||
    nodeHasDataAnalysisDisplay(node) ||
    nodeHasDocumentDisplay(node)
  )
}

export function nodeHasMap(node: TopologyNode) {
  return (
    node.gridDisplaySelection !== undefined ||
    (node.filterIds !== undefined && !node.disableMap)
  )
}

export function nodeHasCharts(node: TopologyNode) {
  return (
    node.displayGroups !== undefined ||
    node.displayId !== undefined ||
    (node.plotId != undefined && node.locationIds != undefined)
  )
}

export function nodeHasDataDownload(node: TopologyNode) {
  return node.filterIds !== undefined && node.dataDownloadDisplay !== undefined
}

export function nodeHasReports(node: TopologyNode) {
  return getReportModuleInstanceIdsForNode(node).length > 0
}

export function getReportModuleInstanceIdsForNode(
  node?: TopologyNode,
): string[] {
  if (!node) return []

  const nodeWithReportModuleInstanceId =
    node as TopologyNodeWithReportModuleInstanceId
  const reportModuleInstanceIds =
    nodeWithReportModuleInstanceId.reportModuleInstanceId
  let directReportModuleInstanceIds: string[] = []
  if (Array.isArray(reportModuleInstanceIds)) {
    directReportModuleInstanceIds = reportModuleInstanceIds
  } else if (reportModuleInstanceIds !== undefined) {
    directReportModuleInstanceIds = [reportModuleInstanceIds]
  }
  const reportDisplayModuleInstanceIds =
    node.reportDisplay?.reports.map((report) => report.moduleInstanceId) ?? []
  const childReportModuleInstanceIds: string[] =
    node.topologyNodes?.flatMap((childNode) =>
      getReportModuleInstanceIdsForNode(childNode),
    ) ?? []

  return Array.from(
    new Set([
      ...directReportModuleInstanceIds,
      ...reportDisplayModuleInstanceIds,
      ...childReportModuleInstanceIds,
    ]),
  )
}

export function nodeHasDynamicReportDisplay(node: TopologyNode) {
  return node.dynamicReportDisplay !== undefined
}

export function nodeHasSchematicStatusDisplay(node: TopologyNode) {
  return node.scadaPanelId !== undefined
}

export function nodeHasSystemMonitor(node: TopologyNode) {
  return node.mainPanel !== undefined && node.mainPanel === 'system monitor'
}

export function nodeHasWebDisplay(node: TopologyNode) {
  return node.embedUrl !== undefined
}

export function nodeHasDashboard(node: TopologyNode) {
  return node.dashboardPanels !== undefined
}

export function nodeHasLogDisplay(node: TopologyNode) {
  return node.logDisplay !== undefined
}

export function nodeHasDataAnalysisDisplay(node: TopologyNode) {
  return node.dataAnalysisDisplayId !== undefined
}

export function nodeHasDocumentDisplay(node: TopologyNode) {
  return node.documentDisplayId !== undefined
}
