import { TopologyNode } from '@deltares/fews-pi-requests'
import { RouteLocationNamedRaw } from 'vue-router'

export interface DisplayTab {
  type:
    | 'charts'
    | 'map'
    | 'reports'
    | 'schematic-status-display'
  id: string
  title: string
  href?: string
  target?: string
  to: RouteLocationNamedRaw
  icon: string
}

export function displayTabsForNode(leafNode: TopologyNode, parentNodeId?: string) {
  const activeNodeId = leafNode.id
  const timeseriesTabId = `${activeNodeId}-timeseries`
  const reportsTabId = `${activeNodeId}-reports`
  const spatialTabId = `${activeNodeId}-spatial`
  const ssdTabId = `${activeNodeId}-ssd`
  const _displayTabs: DisplayTab[] = []
  if (
    leafNode.gridDisplaySelection !== undefined ||
    leafNode.filterIds !== undefined
  ) {
    _displayTabs.push({
      type: 'map',
      id: spatialTabId,
      title: 'Map',
      to: {
        name: 'TopologySpatialDisplay',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
          layerName: leafNode.gridDisplaySelection?.plotId,
        },
      },
      icon: 'mdi-map',
    })
  }
  if (
    leafNode.displayGroups !== undefined ||
    leafNode.displayId !== undefined ||
    (leafNode.plotId != undefined && leafNode.locationIds != undefined)
  ) {
    _displayTabs.push({
      type: 'charts',
      id: timeseriesTabId,
      title: 'Charts',
      to: {
        name: 'TopologyTimeSeries',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
        },
      },
      icon: 'mdi-chart-multiple',
    })
  }
  if (
    leafNode.filterIds !== undefined &&
    leafNode.filterIds.length == 1 &&
    leafNode.dataDownloadDisplay !== undefined
  ) {
    _displayTabs.push({
      type: 'charts',
      id: timeseriesTabId,
      title: 'Download',
      to: {
        name: 'TopologyDataDownload',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
        },
      },
      icon: 'mdi-download',
    })
  }
  if (leafNode.reportDisplay?.reports.length) {
    _displayTabs.push({
      type: 'reports',
      id: reportsTabId,
      title: 'Reports',
      to: {
        name: 'TopologyReports',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
        },
      },
      icon: 'mdi-file-document',
    })
  }
  if (leafNode.scadaPanelId !== undefined) {
    _displayTabs.push({
      type: 'schematic-status-display',
      id: ssdTabId,
      title: 'Schematic',
      to: {
        name: 'TopologySchematicStatusDisplay',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
          panelId: leafNode.scadaPanelId,
        },
      },
      icon: 'mdi-view-dashboard',
    })
  }
  return _displayTabs
}

