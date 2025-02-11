import { TopologyNode } from '@deltares/fews-pi-requests'
import { RouteLocationNamedRaw } from 'vue-router'
import {
  nodeHasCharts,
  nodeHasDashboard,
  nodeHasDataDownload,
  nodeHasLogDisplay,
  nodeHasMap,
  nodeHasReports,
  nodeHasSchematicStatusDisplay,
  nodeHasSystemMonitor,
  nodeHasWebDisplay,
} from './nodes'
import {
  ComponentType,
  componentTypeToIconMap,
  componentTypeToIdMap,
  componentTypeToRouteNameMap,
  componentTypeToTitleMap,
} from './component'

export interface DisplayTab {
  type: ComponentType
  id: string
  title: string
  href?: string
  target?: string
  to: RouteLocationNamedRaw
  icon: string
  active: boolean
}

const displayTabs: DisplayTab[] = Object.values(ComponentType).map((type) => {
  return {
    type,
    id: componentTypeToIdMap[type],
    title: componentTypeToTitleMap[type],
    to: { name: componentTypeToRouteNameMap[type] },
    icon: componentTypeToIconMap[type],
    active: false,
  }
})

export function displayTabsForNode(
  node: TopologyNode,
  parentNodeId?: string,
  topologyId?: string,
) {
  for (const tab of displayTabs) {
    const params = {
      nodeId: parentNodeId ? [parentNodeId, node.id] : [node.id],
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
      case 'data-download-display':
        tab.active = nodeHasDataDownload(node)
        tab.to.params = { ...params }
        break
      case 'report':
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
      case 'html-display':
        tab.active = nodeHasWebDisplay(node)
        tab.to.params = { ...params }
        break
      case 'dashboard':
        tab.active = nodeHasDashboard(node)
        tab.to.params = { ...params }
        break
      case 'log-display':
        tab.active = nodeHasLogDisplay(node)
        tab.to.params = { ...params }
        break
    }
  }
  return displayTabs.filter((tab) => tab.active)
}
