import type { FillPaintProps, LinePaintProps } from 'maplibre-gl'
import type { ComponentType } from './component'

type PaintMapping = {
  fill: FillPaintProps
  line: LinePaintProps
}

export interface ComponentSettingsResponse {
  componentSettings: ComponentSettings[]
  declarations?: Declarations
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

export interface ComponentSettings extends SettingsPerComponent {
  id: string
}

export interface ChartSettings {
  chartEnabled?: boolean
  elevationChartEnabled?: boolean
  tableEnabled?: boolean
  metaDataEnabled?: boolean
  downloadEnabled?: boolean
}

export interface MapSettings extends ChartSettings {
  chartPanelEnabled?: boolean
  locationSearchEnabled?: boolean
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
