import type {
  ChartSettings,
  ComponentSettingsMapping,
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
}

const defaultSchematicStatusDisplaySettings: SchematicStatusDisplaySettings = {
  dateTimeSliderEnabled: true,
  zoomingEnabled: false,
}

export const componentTypeToDefaultSettingsMap: ComponentSettingsMapping = {
  map: defaultMapSettings,
  charts: defaultChartSettings,
  'data-download-display': undefined,
  report: undefined,
  'schematic-status-display': defaultSchematicStatusDisplaySettings,
  'system-monitor': undefined,
  'html-display': undefined,
  dashboard: undefined,
  tasks: undefined,
  'log-display': undefined,
} as const
