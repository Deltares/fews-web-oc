import { TopologyNode } from '@deltares/fews-pi-requests'
import { RouteLocationNamedRaw } from 'vue-router'

export interface DisplayTab {
  type: 'charts' | 'map' | 'reports' | 'schematic-status-display'
  id: string
  title: string
  href?: string
  target?: string
  to: RouteLocationNamedRaw
  icon: string
  active: boolean
}

const displayTabs: DisplayTab[] = [
  {
    type: 'charts',
    id: 'timeseries',
    title: 'Charts',
    to: { name: 'TopologyTimeSeries' },
    icon: 'mdi-chart-multiple',
    active: false,
  },
  {
    type: 'map',
    id: 'spatial',
    title: 'Map',
    to: { name: 'TopologySpatialDisplay' },
    icon: 'mdi-map',
    active: false,
  },
  {
    type: 'reports',
    id: 'reports',
    title: 'Reports',
    to: { name: 'TopologyReports' },
    icon: 'mdi-file-document',
    active: false,
  },
  {
    type: 'schematic-status-display',
    id: 'ssd',
    title: 'Schematic',
    to: { name: 'TopologySchematicStatusDisplay' },
    icon: 'mdi-view-dashboard',
    active: false,
  },
]



function nodeHasMap(node: TopologyNode) {
  return node.gridDisplaySelection !== undefined || node.filterIds !== undefined
}

function nodeHasCharts(node: TopologyNode) {
  return (
    node.displayGroups !== undefined ||
    node.displayId !== undefined ||
    (node.plotId != undefined && node.locationIds != undefined)
  )
}

function nodeHasReports(node: TopologyNode) {
  return node.reportDisplay?.reports !== undefined
}

function nodeHasSchematicStatusDisplay(node: TopologyNode) {
  return node.scadaPanelId !== undefined
}

export function displayTabsForNode(node: TopologyNode, parentNodeId?: string) {
  for (const tab of displayTabs) {
    const params = {
      nodeId: parentNodeId ? [parentNodeId, node.id] : node.id,
    }
    switch (tab.type) {
      case 'map':
        tab.active = nodeHasMap(node)
        tab.to.params = { ...params, LayerName: node.gridDisplaySelection?.plotId,
        }
        break
      case 'charts':
        tab.active = nodeHasCharts(node)
        tab.to.params = { ...params }
        break
      case 'reports':
        tab.active = nodeHasReports(node)
        tab.to.params = { ...params }
        break
      case 'schematic-status-display':
        tab.active = nodeHasSchematicStatusDisplay(node)
        tab.to.params = { ...params, panelId: node.scadaPanelId }
        break
    }
  }
  return displayTabs.filter((tab) => tab.active)
}
