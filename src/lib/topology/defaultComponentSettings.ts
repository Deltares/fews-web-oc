import type {
  ChartSettings,
  ComponentSettingsMapping,
  DashboardSettings,
  MapSettings,
  SchematicStatusDisplaySettings,
} from './componentSettings'

const defaultChartSettings: ChartSettings = {
  chartEnabled: true,
  elevationChartEnabled: true,
  tableEnabled: true,
  metaDataEnabled: true,
  downloadEnabled: true,
}

const defaultMapSettings: MapSettings = {
  ...defaultChartSettings,
  chartPanelEnabled: true,
  locationSearchEnabled: true,
  dateTimeSliderEnabled: true,
}

const defaultSchematicStatusDisplaySettings: SchematicStatusDisplaySettings = {
  dateTimeSliderEnabled: true,
  zoomingEnabled: false,
}

const defaultDashboardSettings: DashboardSettings = {
  dateTimeSliderEnabled: true,
}

export const componentTypeToDefaultSettingsMap: ComponentSettingsMapping = {
  map: defaultMapSettings,
  charts: defaultChartSettings,
  'data-download-display': undefined,
  report: undefined,
  'schematic-status-display': defaultSchematicStatusDisplaySettings,
  'system-monitor': undefined,
  'html-display': undefined,
  dashboard: defaultDashboardSettings,
  tasks: undefined,
  'log-display': undefined,
} as const
