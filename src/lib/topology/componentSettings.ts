import type { FillPaintProps, LinePaintProps } from 'maplibre-gl'
import type { ComponentType } from './component'

type PaintMapping = {
  fill: FillPaintProps
  line: LinePaintProps
}

export interface WebocComponentSettingsResponse {
  webocComponentSettings: WebocComponentSettings[]
}

interface ComponentSettingsMapping {
  map: MapSettings
  charts: ChartSettings
  'data-download': undefined
  reports: undefined
  'schematic-status-display': undefined
  'system-monitor': undefined
  'web-display': undefined
  dashboard: undefined
  tasks: undefined
}

type SettingsPerComponent = {
  [key in ComponentType]?: ComponentSettingsMapping[key]
}

export interface WebocComponentSettings extends SettingsPerComponent {
  id: string
  declarations?: Declarations
}

interface BaseSettings {
  declarations?: Declarations
}

export interface ChartSettings extends BaseSettings {
  chartEnabled?: boolean
  elevationChartEnabled?: boolean
  tableEnabled?: boolean
  metaDataEnabled?: boolean
  downloadEnabled?: boolean
}

export interface MapSettings extends ChartSettings {
  chartPanelEnabled?: boolean
  locationSearchEnabled?: boolean
  baseMaps?: BaseMaps
  overlays?: DeclarationReference[]
}

export interface BaseMaps {
  defaultLightBaseMap: string
  defaultDarkBaseMap: string
  additionalMaps?: DeclarationReference[]
}

export interface Declarations {
  baseMaps?: BaseMap[]
  overlays?: Overlays
}

export interface BaseMap {
  id: string
  name: string
  // TODO: Add layer specification
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

export interface DeclarationReference {
  id: string
  visible: boolean
}
