import type { FillPaintProps, LinePaintProps } from 'maplibre-gl'
import type { ComponentType } from './component'
import { componentTypeToDefaultSettingsMap } from './defaultComponentSettings'

type PaintMapping = {
  fill: FillPaintProps
  line: LinePaintProps
}

export interface ComponentSettingsResponse {
  componentSettings: ComponentSettings[]
  declarations?: Declarations
}

export interface ComponentSettingsMapping {
  map: MapSettings
  charts: ChartSettings
  'data-download-display': undefined
  report: undefined
  'schematic-status-display': SchematicStatusDisplaySettings
  'system-monitor': undefined
  'html-display': undefined
  dashboard: DashboardSettings
  tasks: undefined
  'log-display': undefined
}

type SettingsPerComponent = {
  [key in ComponentType]?: Partial<ComponentSettingsMapping[key]>
}

export interface ComponentSettings extends SettingsPerComponent {
  id: string
}

export interface ChartSettings {
  chartEnabled: boolean
  elevationChartEnabled: boolean
  tableEnabled: boolean
  metaDataEnabled: boolean
  downloadEnabled: boolean
}

export interface MapSettings extends ChartSettings {
  chartPanelEnabled: boolean
  locationSearchEnabled: boolean
  dateTimeSliderEnabled: boolean
}

export interface SchematicStatusDisplaySettings {
  dateTimeSliderEnabled: boolean
  zoomingEnabled: boolean
}

export interface DashboardSettings {
  dateTimeSliderEnabled: boolean
}

export interface Declarations {
  baseMaps?: BaseMap[]
  overlays?: Overlays
}

export interface BaseMap {
  id: string
  name: string
  icon: string
  style: string
}

export interface Overlays {
  locations: OverlayLocation[]
}

export interface OverlayLocation {
  id: string
  name: string
  locationSet: string
  type: keyof PaintMapping
  paint: PaintMapping[OverlayLocation['type']]
}

export function getDefaultSettings<T extends ComponentType>(componentType: T) {
  return componentTypeToDefaultSettingsMap[componentType]
}

export function getSettings<T extends ComponentType>(
  componentSettings: ComponentSettings | undefined,
  componentType: T,
) {
  const defaultSettings = getDefaultSettings(componentType)
  const settings = componentSettings?.[componentType]
  return {
    ...defaultSettings,
    ...settings,
  }
}
