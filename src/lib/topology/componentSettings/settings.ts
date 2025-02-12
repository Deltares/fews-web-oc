import type { FillPaintProps, LinePaintProps } from 'maplibre-gl'
import type { ComponentType } from '@/lib/topology/component'
import {
  defaultChartSettings,
  defaultMapSettings,
  defaultSchematicStatusDisplaySettings,
  defaultReportSettings,
  type MapSettings,
  type ChartsSettings,
  type ReportSettings,
  type SSDSettings,
} from '.'

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
  charts: ChartsSettings
  'data-download-display': undefined
  report: ReportSettings
  'schematic-status-display': SSDSettings
  'system-monitor': undefined
  'html-display': undefined
  dashboard: undefined
  'whatif-display': undefined
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
  'data-download-display': undefined,
  report: defaultReportSettings,
  'schematic-status-display': defaultSchematicStatusDisplaySettings,
  'system-monitor': undefined,
  'html-display': undefined,
  dashboard: undefined,
  'whatif-display': undefined,
  'log-display': undefined,
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
