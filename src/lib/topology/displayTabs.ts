import { TopologyNode } from '@deltares/fews-pi-requests'
import { RouteLocationNamedRaw } from 'vue-router'
import {
  nodeHasCharts,
  nodeHasDashboard,
  nodeHasDataDownload,
  nodeHasMap,
  nodeHasReports,
  nodeHasSchematicStatusDisplay,
  nodeHasSystemMonitor,
} from './nodes'

export interface DisplayTab {
  type:
    | 'charts'
    | 'map'
    | 'reports'
    | 'data-download'
    | 'schematic-status-display'
    | 'system-monitor'
    | 'dashboard'
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
    type: 'map',
    id: 'spatial',
    title: 'Map',
    to: { name: 'TopologySpatialDisplay' },
    icon: 'mdi-map',
    active: false,
  },
  {
    type: 'charts',
    id: 'timeseries',
    title: 'Charts',
    to: { name: 'TopologyTimeSeries' },
    icon: 'mdi-chart-multiple',
    active: false,
  },
  {
    type: 'data-download',
    id: 'download',
    title: 'Download',
    to: { name: 'TopologyDataDownload' },
    icon: 'mdi-download',
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
  {
    type: 'system-monitor',
    id: 'ssd',
    title: 'System Monitor',
    to: { name: 'TopologySystemMonitor' },
    icon: 'mdi-view-dashboard',
    active: false,
  },
  {
    type: 'dashboard',
    id: 'dashboard',
    title: 'Dashboard',
    to: { name: 'TopologyDashboard' },
    icon: 'mdi-view-dashboard',
    active: false,
  },
]

export function displayTabsForNode(
  node: TopologyNode,
  parentNodeId?: string,
  topologyId?: string,
) {
  for (const tab of displayTabs) {
    const params = {
      nodeId: parentNodeId ? [parentNodeId, node.id] : node.id,
      topologyId,
    }
    switch (tab.type) {
      case 'map':
        tab.active = nodeHasMap(node)
        tab.to.params = {
          ...params,
          layerName: node.gridDisplaySelection?.plotId,
        }
        break
      case 'charts':
        tab.active = nodeHasCharts(node)
        tab.to.params = { ...params }
        break
      case 'data-download':
        tab.active = nodeHasDataDownload(node)
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
      case 'system-monitor':
        tab.active = nodeHasSystemMonitor(node)
        tab.to.params = { ...params }
        break
      case 'dashboard':
        tab.active = nodeHasDashboard(node)
        tab.to.params = { ...params }
        break
    }
  }
  return displayTabs.filter((tab) => tab.active)
}
