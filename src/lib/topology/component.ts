import type { WebOCDashboardItem } from '@deltares/fews-pi-requests'

export type ComponentType =
  | WebOCDashboardItem['component']
  | 'dashboard'
  | 'dynamic-report-display'
  | 'data-analysis-display'

export const ComponentType = {
  map: 'map',
  charts: 'charts',
  'data-download-display': 'data-download-display',
  report: 'report',
  'schematic-status-display': 'schematic-status-display',
  'system-monitor': 'system-monitor',
  'html-display': 'html-display',
  'dynamic-report-display': 'dynamic-report-display',
  dashboard: 'dashboard',
  'whatif-display': 'whatif-display',
  'log-display': 'log-display',
  'data-analysis-display': 'data-analysis-display',
} satisfies Record<ComponentType, ComponentType>

export const componentTypeToIconMap = {
  map: 'mdi-map',
  charts: 'mdi-chart-multiple',
  'data-download-display': 'mdi-download',
  report: 'mdi-file-document',
  'schematic-status-display': 'mdi-view-dashboard',
  'dynamic-report-display': 'mdi-file-document-edit',
  'system-monitor': 'mdi-monitor',
  'html-display': 'mdi-web',
  dashboard: 'mdi-view-dashboard',
  'whatif-display': 'mdi-cog',
  'log-display': 'mdi-file-document',
  'data-analysis-display': 'mdi-database',
} satisfies Record<ComponentType, string>

export const componentTypeToTitleMap = {
  map: 'Map',
  charts: 'Charts',
  'data-download-display': 'Download',
  report: 'Reports',
  'schematic-status-display': 'Schematic',
  'system-monitor': 'System Monitor',
  'html-display': 'Web Display',
  'dynamic-report-display': 'Dynamic Report',
  dashboard: 'Dashboard',
  'whatif-display': 'What If',
  'log-display': 'Log',
  'data-analysis-display': 'Data Analysis',
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
  'dynamic-report-display': 'TopologyDynamicReports',
  'whatif-display': 'TopologyWhatIfDisplay',
  'log-display': 'TopologyLogDisplay',
  'data-analysis-display': 'TopologyDataAnalysisDisplay',
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
  'dynamic-report-display': 'dynamicreport',
  'log-display': 'log',
  'data-analysis-display': 'analysis',
} satisfies Record<ComponentType, string>
