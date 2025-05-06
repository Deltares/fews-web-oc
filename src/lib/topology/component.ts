import type { WebOCDashboardItem } from '@deltares/fews-pi-requests'

// FIXME: his is for POC
export type ComponentType =
  | WebOCDashboardItem['component']
  | 'dashboard'
  | 'his'
  | 'documents-display'

export const ComponentType = {
  map: 'map',
  charts: 'charts',
  'data-download-display': 'data-download-display',
  report: 'report',
  'schematic-status-display': 'schematic-status-display',
  'system-monitor': 'system-monitor',
  'html-display': 'html-display',
  dashboard: 'dashboard',
  'whatif-display': 'whatif-display',
  'log-display': 'log-display',
  'documents-display': 'documents-display',
  his: 'his',
} satisfies Record<ComponentType, ComponentType>

export const componentTypeToIconMap = {
  map: 'mdi-map',
  charts: 'mdi-chart-multiple',
  'data-download-display': 'mdi-download',
  report: 'mdi-file-document',
  'schematic-status-display': 'mdi-view-dashboard',
  'system-monitor': 'mdi-monitor',
  'html-display': 'mdi-web',
  dashboard: 'mdi-view-dashboard',
  'whatif-display': 'mdi-cog',
  'log-display': 'mdi-file-document',
  'documents-display': 'mdi-file-document-multiple',
  his: 'mdi-database',
} satisfies Record<ComponentType, string>

export const componentTypeToTitleMap = {
  map: 'Map',
  charts: 'Charts',
  'data-download-display': 'Download',
  report: 'Reports',
  'schematic-status-display': 'Schematic',
  'system-monitor': 'System Monitor',
  'html-display': 'Web Display',
  dashboard: 'Dashboard',
  'whatif-display': 'What If',
  'log-display': 'Log',
  'documents-display': 'Documents Browser',
  his: 'Historical Information System',
} satisfies Record<ComponentType, string>

export const componentTypeToRouteNameMap = {
  map: 'TopologySpatialDisplay',
  charts: 'TopologyTimeSeries',
  'data-download-display': 'TopologyDataDownload',
  report: 'TopologyReports',
  'schematic-status-display': 'TopologySchematicStatusDisplay',
  'system-monitor': 'TopologySystemMonitor',
  'html-display': 'TopologyWebDisplay',
  dashboard: 'TopologyDashboard',
  'whatif-display': 'TopologyWhatIfDisplay',
  'log-display': 'TopologyLogDisplay',
  'documents-display': 'TopologyDocumentsBrowser',
  his: 'TopologyHisDisplay',
} satisfies Record<ComponentType, string>

export const componentTypeToIdMap = {
  map: 'spatial',
  charts: 'timeseries',
  'data-download-display': 'download',
  report: 'reports',
  'schematic-status-display': 'ssd',
  'system-monitor': 'systemmonitor',
  'html-display': 'webdisplay',
  dashboard: 'dashboard',
  'whatif-display': 'whatif',
  'log-display': 'log',
  'documents-display': 'documents',
  his: 'his',
} satisfies Record<ComponentType, string>
