import type { WebOCDashboardItem } from '@deltares/fews-pi-requests'

export type ComponentType =
  | WebOCDashboardItem['component']
  | 'dashboard'
  | 'documents-display'
  | 'dynamic-report-display'
  | 'data-analysis-display'
  | 'html-display'
  | 'embed-url'
  | 'micro-frontend-display'

export const ComponentType = {
  dashboard: 'dashboard',
  map: 'map',
  charts: 'charts',
  'data-analysis-display': 'data-analysis-display',
  'data-download-display': 'data-download-display',
  report: 'report',
  'schematic-status-display': 'schematic-status-display',
  'system-monitor': 'system-monitor',
  'html-display': 'html-display',
  'dynamic-report-display': 'dynamic-report-display',
  'runtask-display': 'runtask-display',
  'log-display': 'log-display',
  'documents-display': 'documents-display',
  'embed-url': 'embed-url',
  'micro-frontend-display': 'micro-frontend-display',
} satisfies Record<ComponentType, ComponentType>

export const componentTypeToIconMap = {
  dashboard: 'mdi-view-dashboard',
  map: 'mdi-map',
  charts: 'mdi-chart-multiple',
  'data-analysis-display': 'mdi-database-search',
  'data-download-display': 'mdi-download',
  report: 'mdi-file-document',
  'schematic-status-display': 'mdi-application',
  'dynamic-report-display': 'mdi-table-clock',
  'system-monitor': 'mdi-monitor',
  'html-display': 'mdi-web',
  'runtask-display': 'mdi-cog',
  'log-display': 'mdi-file-document',
  'documents-display': 'mdi-file-document-multiple',
  'embed-url': 'mdi-link',
  'micro-frontend-display': 'mdi-toy-brick',
} satisfies Record<ComponentType, string>

export const componentTypeToTitleMap = {
  dashboard: 'Dashboard',
  map: 'Map',
  charts: 'Charts',
  'data-analysis-display': 'Data Analysis',
  'data-download-display': 'Download',
  report: 'Reports',
  'schematic-status-display': 'Schematic',
  'system-monitor': 'System Monitor',
  'html-display': 'Web Display',
  'dynamic-report-display': 'Dynamic Report',
  'runtask-display': 'Run Task',
  'log-display': 'Log',
  'documents-display': 'Documents Browser',
  'embed-url': 'Embedded Content',
  'micro-frontend-display': 'Micro Frontend',
} satisfies Record<ComponentType, string>

export const componentTypeToRouteNameMap = {
  dashboard: 'TopologyDashboard',
  map: 'TopologySpatialDisplay',
  charts: 'TopologyTimeSeries',
  'data-analysis-display': 'TopologyDataAnalysisDisplay',
  'data-download-display': 'TopologyDataDownload',
  report: 'TopologyReports',
  'schematic-status-display': 'TopologySchematicStatusDisplay',
  'system-monitor': 'TopologySystemMonitor',
  'html-display': 'TopologyWebDisplay',
  'dynamic-report-display': 'TopologyDynamicReports',
  'runtask-display': 'TopologyWhatIfDisplay',
  'log-display': 'TopologyLogDisplay',
  'documents-display': 'TopologyDocumentDisplay',
  'embed-url': 'TopologyWebDisplay',
  'micro-frontend-display': 'TopologyMicroFrontendDisplay',
} satisfies Record<ComponentType, string>

export const componentTypeToIdMap = {
  dashboard: 'dashboard',
  map: 'spatial',
  charts: 'timeseries',
  'data-analysis-display': 'analysis',
  'data-download-display': 'download',
  report: 'reports',
  'schematic-status-display': 'ssd',
  'system-monitor': 'systemmonitor',
  'html-display': 'webdisplay',
  'runtask-display': 'runtask',
  'dynamic-report-display': 'dynamicreport',
  'log-display': 'log',
  'documents-display': 'documents',
  'embed-url': 'embed',
  'micro-frontend-display': 'mf',
} satisfies Record<ComponentType, string>
