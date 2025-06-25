import type { WebOCDashboardItem } from '@deltares/fews-pi-requests'

export type ComponentType =
  | WebOCDashboardItem['component']
  | 'dashboard'
  | 'documents-display'
  | 'dynamic-report-display'
  | 'data-analysis-display'
  | 'html-display'
  | 'micro-frontend-display'

export const ComponentType = {
  dashboard: 'dashboard',
  map: 'map',
  charts: 'charts',
  'data-download-display': 'data-download-display',
  report: 'report',
  'schematic-status-display': 'schematic-status-display',
  'system-monitor': 'system-monitor',
  'html-display': 'html-display',
  'dynamic-report-display': 'dynamic-report-display',
  'whatif-display': 'whatif-display',
  'log-display': 'log-display',
  'data-analysis-display': 'data-analysis-display',
  'documents-display': 'documents-display',
  'micro-frontend-display': 'micro-frontend-display',
} satisfies Record<ComponentType, ComponentType>

export const componentTypeToIconMap = {
  dashboard: 'mdi-view-dashboard',
  map: 'mdi-map',
  charts: 'mdi-chart-multiple',
  'data-download-display': 'mdi-download',
  report: 'mdi-file-document',
  'schematic-status-display': 'mdi-view-dashboard',
  'dynamic-report-display': 'mdi-file-document-edit',
  'system-monitor': 'mdi-monitor',
  'html-display': 'mdi-web',
  'whatif-display': 'mdi-cog',
  'log-display': 'mdi-file-document',
  'data-analysis-display': 'mdi-database-search',
  'documents-display': 'mdi-file-document-multiple',
  'micro-frontend-display': 'mdi-toy-brick',
} satisfies Record<ComponentType, string>

export const componentTypeToTitleMap = {
  dashboard: 'Dashboard',
  map: 'Map',
  charts: 'Charts',
  'data-download-display': 'Download',
  report: 'Reports',
  'schematic-status-display': 'Schematic',
  'system-monitor': 'System Monitor',
  'html-display': 'Web Display',
  'dynamic-report-display': 'Dynamic Report',
  'whatif-display': 'What If',
  'log-display': 'Log',
  'data-analysis-display': 'Data Analysis',
  'documents-display': 'Documents Browser',
  'micro-frontend-display': 'Micro Frontend',
} satisfies Record<ComponentType, string>

export const componentTypeToRouteNameMap = {
  dashboard: 'TopologyDashboard',
  map: 'TopologySpatialDisplay',
  charts: 'TopologyTimeSeries',
  'data-download-display': 'TopologyDataDownload',
  report: 'TopologyReports',
  'schematic-status-display': 'TopologySchematicStatusDisplay',
  'system-monitor': 'TopologySystemMonitor',
  'html-display': 'TopologyWebDisplay',
  'dynamic-report-display': 'TopologyDynamicReports',
  'whatif-display': 'TopologyWhatIfDisplay',
  'log-display': 'TopologyLogDisplay',
  'data-analysis-display': 'TopologyDataAnalysisDisplay',
  'documents-display': 'TopologyDocumentDisplay',
  'micro-frontend-display': 'TopologyMicroFrontendDisplay',
} satisfies Record<ComponentType, string>

export const componentTypeToIdMap = {
  dashboard: 'dashboard',
  map: 'spatial',
  charts: 'timeseries',
  'data-download-display': 'download',
  report: 'reports',
  'schematic-status-display': 'ssd',
  'system-monitor': 'systemmonitor',
  'html-display': 'webdisplay',
  'whatif-display': 'whatif',
  'dynamic-report-display': 'dynamicreport',
  'log-display': 'log',
  'data-analysis-display': 'analysis',
  'documents-display': 'documents',
  'micro-frontend-display': 'mf',
} satisfies Record<ComponentType, string>
