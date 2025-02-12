import type { FillPaintProps, LinePaintProps } from 'maplibre-gl'
import {
  defaultChartSettings,
  defaultMapSettings,
  defaultSchematicStatusDisplaySettings,
  defaultReportSettings,
} from '.'
import { WebOCComponentSettings } from '@deltares/fews-pi-requests'
import { DeepRequired } from '@/lib/utils/types'
import { merge } from 'lodash-es'

type PaintMapping = {
  fill: FillPaintProps
  line: LinePaintProps
}

export interface ComponentSettingsResponse {
  componentSettings: ComponentSettings[]
  declarations?: Declarations
}

export type ComponentSettings = DeepRequired<WebOCComponentSettings>

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

export function getDefaultSettings(): ComponentSettings {
  return {
    id: '',
    map: defaultMapSettings,
    ssd: defaultSchematicStatusDisplaySettings,
    charts: defaultChartSettings,
    report: defaultReportSettings,
  }
}

export function getSettings(
  componentSettings: WebOCComponentSettings | undefined,
  parentComponentSettings?: WebOCComponentSettings,
): WebOCComponentSettings {
  const defaultSettings = getDefaultSettings()
  return merge({}, defaultSettings, parentComponentSettings, componentSettings)
}
