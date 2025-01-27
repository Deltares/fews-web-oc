import type { FillPaintProps, LinePaintProps } from 'maplibre-gl'
import type { ComponentType } from '../component'
import { type ChartSettings, defaultChartSettings } from './chartSettings'
import { type MapSettings, defaultMapSettings } from './mapSettings'
import {
  type SchematicStatusDisplaySettings,
  defaultSchematicStatusDisplaySettings,
} from './schematicStatusDisplaySettings'
import {
  type DashboardSettings,
  defaultDashboardSettings,
} from './dashboardSettings'

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

export const componentTypeToDefaultSettingsMap: ComponentSettingsMapping = {
  map: defaultMapSettings,
  charts: defaultChartSettings,
  'data-download': undefined,
  reports: undefined,
  'schematic-status-display': defaultSchematicStatusDisplaySettings,
  'system-monitor': undefined,
  'web-display': undefined,
  dashboard: defaultDashboardSettings,
  tasks: undefined,
} as const

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
