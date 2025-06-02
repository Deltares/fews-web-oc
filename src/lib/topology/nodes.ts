import type { ColumnItem } from '@/components/general/ColumnItem'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import type {
  TopologyNode,
  TopologyThresholdNode,
} from '@deltares/fews-pi-requests'
import { getWorkflowIdsForNode } from '../workflows/tasks'

export function nodeButtonItems(
  node: TopologyNode,
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
        node,
      ),
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
  return (
    nodeHasSchematicStatusDisplay(node) ||
    nodeHasMap(node) ||
    nodeHasCharts(node) ||
    nodeHasDataDownload(node) ||
    nodeHasReports(node) ||
    nodeHasSystemMonitor(node) ||
    nodeHasWebDisplay(node) ||
    nodeHasDashboard(node) ||
    nodeHasWhatIfs(node) ||
    nodeHasWebDisplay(node) ||
    nodeHasLogDisplay(node) ||
    nodeHasDynamicReportDisplay(node) ||
    nodeHasHIS(node)
  )
}

export function nodeHasMap(node: TopologyNode) {
  return node.gridDisplaySelection !== undefined || node.filterIds !== undefined
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
  return node.reportDisplay?.reports !== undefined
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

export function nodeHasWhatIfs(node: TopologyNode) {
  const workflowIds = getWorkflowIdsForNode(node)
  const availableWorkflows = useAvailableWorkflowsStore()
  return workflowIds.some((workflowId) =>
    availableWorkflows.hasWhatIfTemplate(workflowId),
  )
}
export function nodeHasLogDisplay(node: TopologyNode) {
  return node.logDisplay !== undefined
}

export function nodeHasHIS(node: TopologyNode) {
  return node.dataAnalysisDisplayId !== undefined
}
