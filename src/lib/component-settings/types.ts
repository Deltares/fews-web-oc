import type {
  FillPaintProps,
  LinePaintProps,
} from 'maplibre-gl'

type PaintMapping = {
  fill: FillPaintProps
  line: LinePaintProps
}

export interface WebocComponentSettingsResponse {
  webocComponentSettings: WebocComponentSettings[]
}

export interface WebocComponentSettings {
  id: string
  declarations?: Declarations
  map: MapSettings
  chart: ChartSettings
}

export interface ChartSettings {
  chartEnabled: boolean
  tableEnabled: boolean
  metaDataEnabled: boolean
  downloadEnabled: boolean
}

export interface Declarations {
  baseMaps: BaseMap[]
  overlays: Overlays
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

export interface MapSettings {
  graphPanelEnabled?: boolean
  locationSearchEnabled: boolean
  chartEnabled?: boolean
  tableEnabled?: boolean
  metaDataEnabled?: boolean
  downloadEnabled?: boolean
  baseMaps: BaseMaps
  overlays: DeclarationReference[]
  chartPanelEnabled?: boolean
}

export interface BaseMaps {
  defaultLightBaseMap: string
  defaultDarkBaseMap: string
  additionalMaps: DeclarationReference[]
}

export interface DeclarationReference {
  id: string
  visible: boolean
}
