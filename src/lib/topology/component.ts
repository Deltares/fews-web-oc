import type { WebOCDashboardItem } from '@deltares/fews-pi-requests'

export type ComponentType =
  | WebOCDashboardItem['component']
  | 'tasks'
  | 'dashboard'

export const ComponentType = {
  map: 'map',
  charts: 'charts',
  'data-download-display': 'data-download-display',
  report: 'report',
  'schematic-status-display': 'schematic-status-display',
  'system-monitor': 'system-monitor',
  'html-display': 'html-display',
  dashboard: 'dashboard',
  tasks: 'tasks',
  'log-display': 'log-display',
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
  tasks: 'mdi-cog',
  'log-display': 'mdi-file-document',
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
  tasks: 'Tasks',
  'log-display': 'Log',
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
  tasks: 'TopologyTasksDisplay',
  'log-display': 'TopologyLogDisplay',
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
  tasks: crypto.randomUUID(),
  'log-display': 'log',
} satisfies Record<ComponentType, string>
