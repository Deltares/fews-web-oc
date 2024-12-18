export const ComponentType = {
  map: 'map',
  charts: 'charts',
  'data-download': 'data-download',
  reports: 'reports',
  'schematic-status-display': 'schematic-status-display',
  'system-monitor': 'system-monitor',
  'web-display': 'web-display',
  dashboard: 'dashboard',
  tasks: 'tasks',
} as const

export type ComponentType = (typeof ComponentType)[keyof typeof ComponentType]

export const componentTypeToIconMap = {
  map: 'mdi-map',
  charts: 'mdi-chart-multiple',
  'data-download': 'mdi-download',
  reports: 'mdi-file-document',
  'schematic-status-display': 'mdi-view-dashboard',
  'system-monitor': 'mdi-monitor',
  'web-display': 'mdi-web',
  dashboard: 'mdi-view-dashboard',
  tasks: 'mdi-cog',
} satisfies Record<ComponentType, string>

export const componentTypeToTitleMap = {
  map: 'Map',
  charts: 'Charts',
  'data-download': 'Download',
  reports: 'Reports',
  'schematic-status-display': 'Schematic',
  'system-monitor': 'System Monitor',
  'web-display': 'Web Display',
  dashboard: 'Dashboard',
  tasks: 'Tasks',
} satisfies Record<ComponentType, string>

export const componentTypeToRouteNameMap = {
  map: 'TopologySpatialDisplay',
  charts: 'TopologyTimeSeries',
  'data-download': 'TopologyDataDownload',
  reports: 'TopologyReports',
  'schematic-status-display': 'TopologySchematicStatusDisplay',
  'system-monitor': 'TopologySystemMonitor',
  'web-display': 'TopologyWebDisplay',
  dashboard: 'TopologyDashboard',
  tasks: 'TopologyTasks',
} satisfies Record<ComponentType, string>

export const componentTypeToIdMap = {
  map: 'spatial',
  charts: 'timeseries',
  'data-download': 'download',
  reports: 'reports',
  'schematic-status-display': 'ssd',
  'system-monitor': 'systemmonitor',
  'web-display': 'webdisplay',
  dashboard: 'dashboard',
  tasks: crypto.randomUUID(),
} satisfies Record<ComponentType, string>
